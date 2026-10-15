/* ==========================================================================
   Sentinel — fraud detection console
   Subscribes to the Spring Boot STOMP topics, keeps a rolling session buffer,
   and renders the tiles, charts and live feed from it.

   Note on time: the server formats trans_time as an IST wall-clock string, so
   parsing it against the browser's local zone would skew every window filter.
   Arrival time drives windowing and the throughput axis; the server's string is
   shown verbatim in the feed.
   ========================================================================== */
(function () {
  'use strict';

  // ----------------------------------------------------------------- config
  var TICK_MS      = 5000;  // server pushes on this cadence
  var MAX_TICKS    = 180;   // 15 minutes of history
  var MAX_TXNS     = 1200;  // rolling session buffer
  var MAX_FEED_ROWS = 120;  // rows actually rendered

  var COLORS = {
    fraud: cssVar('--fraud', '#d03b3b'),
    clean: cssVar('--clean', '#3987e5')
  };

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function refreshColors() {
    COLORS.fraud = cssVar('--fraud', '#d03b3b');
    COLORS.clean = cssVar('--clean', '#3987e5');
  }

  // ------------------------------------------------------------------ state
  var txns = [];                       // newest last
  var seen = Object.create(null);      // dedupe keys
  var ticks = [];                      // [{t, clean, fraud}]
  var pending = { clean: 0, fraud: 0 };

  var filters = { window: 300, stream: 'all', query: '' };

  var el = {};
  ['clock','conn','conn-text','theme-toggle','window-filter','stream-filter','search',
   'c-all','c-fraud','c-clean','kpi-rate','kpi-rate-meter','kpi-rate-note','kpi-total',
   'kpi-total-note','kpi-fraud','kpi-fraud-delta','kpi-amount','kpi-distance',
   'spark-total','spark-fraud','legend-throughput','chart-throughput','tip-throughput',
   'table-throughput','chart-category','tip-category','table-category','feed-body',
   'feed-empty','feed-sub','toggle-table-throughput','toggle-table-category'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  // ------------------------------------------------------------- formatting
  function compact(n) {
    if (!isFinite(n)) return '—';
    var a = Math.abs(n);
    if (a >= 1e6) return trim(n / 1e6) + 'M';
    if (a >= 1e4) return trim(n / 1e3) + 'K';
    return Math.round(n).toLocaleString('en-US');
  }
  function trim(v) { return (Math.round(v * 10) / 10).toString(); }

  function money(n) {
    if (!isFinite(n)) return '$0';
    var a = Math.abs(n);
    if (a >= 1e6) return '$' + trim(n / 1e6) + 'M';
    if (a >= 1e4) return '$' + trim(n / 1e3) + 'K';
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  // "2026-10-15 14:28:59" -> "14:28:59"; anything else passes through.
  function timeOf(s) {
    if (typeof s !== 'string') return '—';
    var m = s.match(/(\d{2}:\d{2}:\d{2})/);
    return m ? m[1] : s;
  }

  function maskCard(cc) {
    var s = String(cc == null ? '' : cc);
    return s.length > 4 ? '•••• ' + s.slice(-4) : s;
  }

  // ------------------------------------------------------------- SVG helper
  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    return node;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  // Square at the baseline, 4px rounded at the data end.
  function barPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w, h / 2));
    if (w <= 0) return 'M' + x + ',' + y + ' V' + (y + h);
    return 'M' + x + ',' + y +
           ' H' + (x + w - r) +
           ' A' + r + ',' + r + ' 0 0 1 ' + (x + w) + ',' + (y + r) +
           ' V' + (y + h - r) +
           ' A' + r + ',' + r + ' 0 0 1 ' + (x + w - r) + ',' + (y + h) +
           ' H' + x + ' Z';
  }

  function niceMax(v) {
    if (v <= 4) return 4;
    var mag = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) {
      var c = steps[i] * mag;
      if (v <= c) return c;
    }
    return 10 * mag;
  }

  // ----------------------------------------------------------- data intake
  function ingest(list, isFraud) {
    if (!list || !list.length) return 0;
    var now = Date.now(), added = 0;
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r) continue;
      var key = String(r.trans_num) + '|' + String(r.trans_time);
      if (seen[key]) continue;
      seen[key] = 1;
      txns.push({
        key: key,
        fraud: isFraud,
        receivedAt: now,
        time: timeOf(r.trans_time),
        cc: r.cc_num,
        amt: Number(r.amt) || 0,
        category: r.category == null ? '' : String(r.category),
        merchant: r.merchant == null ? '' : String(r.merchant),
        distance: Number(r.distance) || 0,
        age: r.age == null ? '' : r.age,
        trans_num: r.trans_num == null ? '' : String(r.trans_num)
      });
      added++;
    }
    if (added) {
      if (isFraud) pending.fraud += added; else pending.clean += added;
      if (txns.length > MAX_TXNS) {
        var drop = txns.splice(0, txns.length - MAX_TXNS);
        for (var d = 0; d < drop.length; d++) delete seen[drop[d].key];
      }
    }
    return added;
  }

  function sampleTick() {
    ticks.push({ t: Date.now(), clean: pending.clean, fraud: pending.fraud });
    pending.clean = 0;
    pending.fraud = 0;
    if (ticks.length > MAX_TICKS) ticks.splice(0, ticks.length - MAX_TICKS);
    render();
  }

  // ------------------------------------------------------------- selection
  function inWindow() {
    var cutoff = filters.window ? Date.now() - filters.window * 1000 : 0;
    var out = [];
    for (var i = 0; i < txns.length; i++) {
      if (txns[i].receivedAt >= cutoff) out.push(txns[i]);
    }
    return out;
  }

  function matchesQuery(t, q) {
    if (!q) return true;
    return String(t.cc).indexOf(q) !== -1 ||
           t.merchant.toLowerCase().indexOf(q) !== -1 ||
           t.category.toLowerCase().indexOf(q) !== -1 ||
           t.trans_num.toLowerCase().indexOf(q) !== -1;
  }

  function visibleTicks() {
    if (!filters.window) return ticks;
    var n = Math.ceil(filters.window * 1000 / TICK_MS);
    return ticks.slice(Math.max(0, ticks.length - n));
  }

  // ---------------------------------------------------------------- render
  function render() {
    var scoped = inWindow();
    var q = filters.query;

    var nFraud = 0, nClean = 0;
    for (var i = 0; i < scoped.length; i++) scoped[i].fraud ? nFraud++ : nClean++;

    el['c-all'].textContent   = compact(scoped.length);
    el['c-fraud'].textContent = compact(nFraud);
    el['c-clean'].textContent = compact(nClean);

    renderTiles(scoped, nFraud, nClean);
    renderThroughput();
    renderCategory(scoped);
    renderFeed(scoped, q);
  }

  function renderTiles(scoped, nFraud, nClean) {
    var total = scoped.length;

    var rate = total ? (nFraud / total) * 100 : NaN;
    el['kpi-rate'].textContent = total ? trim(rate) + '%' : '—';
    el['kpi-rate-meter'].style.width = (total ? Math.min(100, rate) : 0) + '%';
    el['kpi-rate-note'].textContent = total
      ? compact(nFraud) + ' of ' + compact(total) + ' screened'
      : 'Awaiting first transactions';

    el['kpi-total'].textContent = compact(total);
    el['kpi-total-note'].textContent = windowLabel();

    el['kpi-fraud'].textContent = compact(nFraud);

    // Trend over the visible ticks: latest tick vs the mean of the rest.
    var vt = visibleTicks();
    var delta = el['kpi-fraud-delta'];
    if (vt.length >= 3) {
      var last = vt[vt.length - 1].fraud;
      var prior = 0;
      for (var i = 0; i < vt.length - 1; i++) prior += vt[i].fraud;
      prior = prior / (vt.length - 1);
      var diff = last - prior;
      delta.textContent = (diff >= 0 ? '+' : '−') + trim(Math.abs(diff)) + ' vs interval avg';
      delta.setAttribute('data-dir', diff > 0 ? 'bad' : (diff < 0 ? 'good' : 'flat'));
    } else {
      delta.textContent = 'building trend…';
      delta.removeAttribute('data-dir');
    }

    var amt = 0, dist = 0;
    for (var j = 0; j < scoped.length; j++) {
      if (scoped[j].fraud) { amt += scoped[j].amt; dist += scoped[j].distance; }
    }
    el['kpi-amount'].textContent = money(amt);
    el['kpi-distance'].textContent = nFraud ? trim(dist / nFraud) : '—';

    sparkline(el['spark-total'], vt.map(function (d) { return d.clean + d.fraud; }), COLORS.clean);
    sparkline(el['spark-fraud'], vt.map(function (d) { return d.fraud; }), COLORS.fraud);
  }

  function windowLabel() {
    return filters.window ? 'in last ' + (filters.window / 60) + 'm' : 'this session';
  }

  // --------------------------------------------------------- sparkline (tile)
  function sparkline(host, vals, color) {
    clear(host);
    if (!vals || vals.length < 2) return;
    var pts = vals.slice(-12);
    var W = 120, H = 30, pad = 3;
    var max = Math.max.apply(null, pts), min = Math.min.apply(null, pts);
    if (max === min) { max = min + 1; }
    var dx = pts.length > 1 ? (W - pad * 2) / (pts.length - 1) : 0;
    var y = function (v) { return H - pad - ((v - min) / (max - min)) * (H - pad * 2); };

    var d = '';
    for (var i = 0; i < pts.length; i++) {
      d += (i ? ' L' : 'M') + (pad + i * dx).toFixed(1) + ',' + y(pts[i]).toFixed(1);
    }
    host.appendChild(svg('path', {
      d: d, fill: 'none', stroke: 'var(--text-muted)', 'stroke-width': 1.5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'vector-effect': 'non-scaling-stroke', opacity: .65
    }));
    // Current interval carries the accent.
    host.appendChild(svg('circle', {
      cx: (pad + (pts.length - 1) * dx).toFixed(1), cy: y(pts[pts.length - 1]).toFixed(1),
      r: 2.4, fill: color
    }));
  }

  // ------------------------------------------------------- throughput chart
  var thState = null;

  function renderThroughput() {
    var host = el['chart-throughput'];
    var data = visibleTicks();
    clear(host);

    var W = 760, H = 230, L = 40, R = 52, T = 14, B = 28;
    var x0 = L, x1 = W - R, y0 = T, y1 = H - B;

    if (data.length < 2) {
      host.appendChild(text(W / 2, H / 2, 'Collecting intervals…', {
        'class': 'tick-text', 'text-anchor': 'middle'
      }));
      renderLegend(0, 0);
      thState = null;
      return;
    }

    var peak = 0;
    for (var i = 0; i < data.length; i++) peak = Math.max(peak, data[i].clean, data[i].fraud);
    var yMax = niceMax(peak);

    var dx = (x1 - x0) / (data.length - 1);
    var X = function (i) { return x0 + i * dx; };
    var Y = function (v) { return y1 - (v / yMax) * (y1 - y0); };

    // gridlines + y ticks (recessive, hairline, solid)
    var steps = 4;
    for (var s = 0; s <= steps; s++) {
      var v = (yMax / steps) * s, gy = Y(v);
      host.appendChild(svg('line', {
        x1: x0, x2: x1, y1: gy, y2: gy,
        'class': s === 0 ? 'axis-line' : 'grid-line'
      }));
      host.appendChild(text(x0 - 8, gy + 3.5, compact(v), {
        'class': 'tick-text', 'text-anchor': 'end'
      }));
    }

    // x ticks: first, middle, last — elapsed seconds, so the axis reads as time
    var lastT = data[data.length - 1].t;
    [0, Math.floor((data.length - 1) / 2), data.length - 1].forEach(function (i, n, arr) {
      if (arr.indexOf(i) !== n) return;
      var secs = Math.round((lastT - data[i].t) / 1000);
      host.appendChild(text(X(i), y1 + 17, secs === 0 ? 'now' : '−' + secs + 's', {
        'class': 'tick-text',
        'text-anchor': i === 0 ? 'start' : (i === data.length - 1 ? 'end' : 'middle')
      }));
    });

    // series: area wash then 2px line
    [
      { key: 'clean', color: COLORS.clean, name: 'Clean' },
      { key: 'fraud', color: COLORS.fraud, name: 'Fraud' }
    ].forEach(function (ser) {
      var d = '', a = 'M' + X(0) + ',' + y1;
      for (var i = 0; i < data.length; i++) {
        var px = X(i), py = Y(data[i][ser.key]);
        d += (i ? ' L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1);
        a += ' L' + px.toFixed(1) + ',' + py.toFixed(1);
      }
      a += ' L' + X(data.length - 1) + ',' + y1 + ' Z';

      host.appendChild(svg('path', { d: a, fill: ser.color, opacity: .10, stroke: 'none' }));
      host.appendChild(svg('path', {
        d: d, fill: 'none', stroke: ser.color, 'stroke-width': 2,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'class': 'series-line'
      }));

      // end marker: >=8px, 2px surface ring so it stays legible on crossings
      var ex = X(data.length - 1), ey = Y(data[data.length - 1][ser.key]);
      host.appendChild(svg('circle', {
        cx: ex, cy: ey, r: 4.5, fill: ser.color, 'class': 'end-dot',
        stroke: 'var(--surface-1)', 'stroke-width': 2
      }));
      // direct end label (2 series, so both get one — supplements the legend)
      host.appendChild(text(ex + 9, ey + 3.5, String(data[data.length - 1][ser.key]), {
        'class': 'value-label', 'text-anchor': 'start'
      }));
    });

    var last = data[data.length - 1];
    renderLegend(last.clean, last.fraud);

    // crosshair + one tooltip listing every series
    var hit = svg('rect', {
      x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0),
      fill: 'transparent', style: 'cursor:crosshair'
    });
    host.appendChild(hit);
    thState = { data: data, X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, dx: dx, host: host };
    hit.addEventListener('pointermove', onThroughputMove);
    hit.addEventListener('pointerleave', hideThroughputTip);

    renderThroughputTable(data);
  }

  function renderLegend(cleanVal, fraudVal) {
    var host = el['legend-throughput'];
    clear(host);
    [
      { name: 'Clean', color: COLORS.clean, val: cleanVal },
      { name: 'Fraud', color: COLORS.fraud, val: fraudVal }
    ].forEach(function (s) {
      var item = document.createElement('span');
      item.className = 'legend-item';
      var key = document.createElement('span');
      key.className = 'legend-key';
      key.style.background = s.color;
      var name = document.createElement('span');
      name.textContent = s.name;
      var val = document.createElement('span');
      val.className = 'legend-value';
      val.textContent = compact(s.val);
      item.appendChild(key);
      item.appendChild(name);
      item.appendChild(val);
      host.appendChild(item);
    });
  }

  function onThroughputMove(ev) {
    if (!thState) return;
    var st = thState;
    var box = st.host.getBoundingClientRect();
    var vb = st.host.viewBox.baseVal;
    var scale = vb.width / box.width;
    var vx = (ev.clientX - box.left) * scale;

    var i = Math.round((vx - st.x0) / st.dx);
    i = Math.max(0, Math.min(st.data.length - 1, i));
    var pt = st.data[i];

    var old = st.host.querySelector('.crosshair');
    if (old) old.parentNode.removeChild(old);
    var line = svg('line', {
      x1: st.X(i), x2: st.X(i), y1: st.y0, y2: st.y1, 'class': 'crosshair'
    });
    st.host.insertBefore(line, st.host.firstChild);

    var tip = el['tip-throughput'];
    clear(tip);
    var head = document.createElement('div');
    head.className = 'tooltip-head';
    var secs = Math.round((st.data[st.data.length - 1].t - pt.t) / 1000);
    head.textContent = secs === 0 ? 'current interval' : secs + 's ago';
    tip.appendChild(head);
    [
      { name: 'Clean', color: COLORS.clean, v: pt.clean },
      { name: 'Fraud', color: COLORS.fraud, v: pt.fraud }
    ].forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'tooltip-row';
      var key = document.createElement('span');
      key.className = 'tooltip-key';
      key.style.background = s.color;
      var val = document.createElement('span');
      val.className = 'tooltip-val';
      val.textContent = String(s.v);
      var nm = document.createElement('span');
      nm.className = 'tooltip-name';
      nm.textContent = s.name;
      row.appendChild(key); row.appendChild(val); row.appendChild(nm);
      tip.appendChild(row);
    });

    var px = (st.X(i) / scale) + st.host.offsetLeft;
    var py = (Math.min(st.Y(pt.clean), st.Y(pt.fraud)) / scale) + st.host.offsetTop;
    tip.style.left = px + 'px';
    tip.style.top = py + 'px';
    tip.setAttribute('data-show', '1');
  }

  function hideThroughputTip() {
    el['tip-throughput'].removeAttribute('data-show');
    if (thState) {
      var old = thState.host.querySelector('.crosshair');
      if (old) old.parentNode.removeChild(old);
    }
  }

  function renderThroughputTable(data) {
    var host = el['table-throughput'];
    clear(host);
    var tbl = document.createElement('table');
    tbl.className = 'data-table';
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    ['Interval', 'Clean', 'Fraud'].forEach(function (h) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = h;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    tbl.appendChild(thead);
    var tb = document.createElement('tbody');
    var lastT = data[data.length - 1].t;
    for (var i = data.length - 1; i >= 0; i--) {
      var tr = document.createElement('tr');
      var secs = Math.round((lastT - data[i].t) / 1000);
      [secs === 0 ? 'now' : '−' + secs + 's', String(data[i].clean), String(data[i].fraud)]
        .forEach(function (v) {
          var td = document.createElement('td');
          td.textContent = v;
          tr.appendChild(td);
        });
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
    host.appendChild(tbl);
  }

  // --------------------------------------------------------- category chart
  function renderCategory(scoped) {
    var host = el['chart-category'];
    clear(host);

    var tally = Object.create(null);
    for (var i = 0; i < scoped.length; i++) {
      if (!scoped[i].fraud) continue;
      var c = scoped[i].category || 'unknown';
      tally[c] = (tally[c] || 0) + 1;
    }
    var rows = Object.keys(tally).map(function (k) { return { name: k, v: tally[k] }; })
      .sort(function (a, b) { return b.v - a.v; });

    var W = 420, H = 258;
    if (!rows.length) {
      host.appendChild(text(W / 2, H / 2 - 6, 'No fraud in this window', {
        'class': 'tick-text', 'text-anchor': 'middle'
      }));
      clear(el['table-category']);
      return;
    }

    // Fold the tail so the chart never grows unbounded.
    if (rows.length > 7) {
      var other = rows.slice(6).reduce(function (s, r) { return s + r.v; }, 0);
      rows = rows.slice(0, 6).concat([{ name: 'Other', v: other }]);
    }

    var LAB = 116, RVAL = 38;
    var xBar = LAB + 8, xEnd = W - RVAL;
    var rowH = Math.min(34, (H - 20) / rows.length);
    var barH = Math.min(24, rowH - 10);
    // Centre the block so a window with only one or two categories doesn't
    // leave the bars pinned to the top of an otherwise empty card.
    var Tp = Math.max(10, (H - rows.length * rowH) / 2);
    var max = niceMax(rows[0].v);

    host.appendChild(svg('line', {
      x1: xBar, x2: xBar, y1: Tp, y2: Tp + rows.length * rowH, 'class': 'axis-line'
    }));

    rows.forEach(function (r, i) {
      var g = svg('g', { 'class': 'bar-row' });
      var y = Tp + i * rowH + (rowH - barH) / 2;
      var w = (r.v / max) * (xEnd - xBar);

      // category label (text token, never the data color)
      g.appendChild(text(LAB, y + barH / 2 + 4, r.name.replace(/_/g, ' '), {
        'class': 'cat-label', 'text-anchor': 'end'
      }));

      g.appendChild(svg('path', {
        d: barPath(xBar, y, Math.max(2, w), barH, 4),
        fill: COLORS.fraud, 'class': 'bar'
      }));

      // value at the tip, always outside the bar end
      g.appendChild(text(xBar + Math.max(2, w) + 7, y + barH / 2 + 4, String(r.v), {
        'class': 'value-label', 'text-anchor': 'start'
      }));

      // hit target spans the whole row — bigger than the mark
      var hit = svg('rect', {
        x: 0, y: Tp + i * rowH, width: W, height: rowH, 'class': 'bar-hit'
      });
      hit.addEventListener('pointermove', function (ev) { showCatTip(ev, r); });
      hit.addEventListener('pointerleave', function () {
        el['tip-category'].removeAttribute('data-show');
      });
      g.appendChild(hit);

      host.appendChild(g);
    });

    renderCategoryTable(rows);
  }

  function showCatTip(ev, r) {
    var tip = el['tip-category'];
    var host = el['chart-category'];
    clear(tip);
    var head = document.createElement('div');
    head.className = 'tooltip-head';
    head.textContent = r.name.replace(/_/g, ' ');
    tip.appendChild(head);
    var row = document.createElement('div');
    row.className = 'tooltip-row';
    var key = document.createElement('span');
    key.className = 'tooltip-key';
    key.style.background = COLORS.fraud;
    var val = document.createElement('span');
    val.className = 'tooltip-val';
    val.textContent = String(r.v);
    var nm = document.createElement('span');
    nm.className = 'tooltip-name';
    nm.textContent = r.v === 1 ? 'fraud txn' : 'fraud txns';
    row.appendChild(key); row.appendChild(val); row.appendChild(nm);
    tip.appendChild(row);

    var box = host.getBoundingClientRect();
    tip.style.left = (ev.clientX - box.left + host.offsetLeft) + 'px';
    tip.style.top  = (ev.clientY - box.top + host.offsetTop) + 'px';
    tip.setAttribute('data-show', '1');
  }

  function renderCategoryTable(rows) {
    var host = el['table-category'];
    clear(host);
    var tbl = document.createElement('table');
    tbl.className = 'data-table';
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    ['Category', 'Fraud txns'].forEach(function (h) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = h;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    tbl.appendChild(thead);
    var tb = document.createElement('tbody');
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var a = document.createElement('td');
      a.textContent = r.name.replace(/_/g, ' ');
      var b = document.createElement('td');
      b.textContent = String(r.v);
      tr.appendChild(a); tr.appendChild(b);
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    host.appendChild(tbl);
  }

  function text(x, y, str, attrs) {
    var t = svg('text', attrs || {});
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.textContent = str;   // untrusted labels never go through innerHTML
    return t;
  }

  // ------------------------------------------------------------- live feed
  var renderedKeys = Object.create(null);

  function renderFeed(scoped, q) {
    var rows = [];
    for (var i = scoped.length - 1; i >= 0 && rows.length < MAX_FEED_ROWS; i--) {
      var t = scoped[i];
      if (filters.stream === 'fraud' && !t.fraud) continue;
      if (filters.stream === 'clean' && t.fraud) continue;
      if (!matchesQuery(t, q)) continue;
      rows.push(t);
    }

    el['feed-empty'].style.display = rows.length ? 'none' : '';
    el['feed-sub'].textContent = rows.length
      ? 'newest first · showing ' + rows.length + (rows.length === MAX_FEED_ROWS ? ' most recent' : '')
      : 'newest first';

    var body = el['feed-body'];
    clear(body);

    var nextKeys = Object.create(null);
    rows.forEach(function (t) {
      nextKeys[t.key] = 1;
      var tr = document.createElement('tr');
      tr.className = t.fraud ? 'row-fraud' : '';
      if (!renderedKeys[t.key]) tr.className += ' is-new';

      tr.appendChild(cellVerdict(t.fraud));
      tr.appendChild(cell(t.time, 'num'));
      tr.appendChild(cell(maskCard(t.cc), 'num strong'));
      tr.appendChild(cell(money(t.amt), 'num strong'));
      tr.appendChild(cell(t.category.replace(/_/g, ' ')));
      tr.appendChild(cell(t.merchant));
      tr.appendChild(cell(trim(t.distance) + ' km', 'num'));
      tr.appendChild(cell(String(t.age), 'num'));
      tr.appendChild(cell(t.trans_num.slice(0, 12), 'mono'));

      body.appendChild(tr);
    });
    renderedKeys = nextKeys;
  }

  function cell(value, cls) {
    var td = document.createElement('td');
    if (cls) td.className = cls;
    td.textContent = value;   // data from Kafka — text only
    return td;
  }

  function cellVerdict(isFraud) {
    var td = document.createElement('td');
    var chip = document.createElement('span');
    chip.className = 'chip ' + (isFraud ? 'fraud' : 'clean');
    // icon + label: the state never rides on color alone
    var ic = svg('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    ic.setAttribute('aria-hidden', 'true');
    ic.appendChild(svg('path', {
      d: isFraud ? 'M12 8v5M12 17h.01M10.3 3.6L2.5 18a1.8 1.8 0 0 0 1.6 2.7h15.8A1.8 1.8 0 0 0 21.5 18L13.7 3.6a1.9 1.9 0 0 0-3.4 0z'
                 : 'M20 6L9 17l-5-5'
    }));
    chip.appendChild(ic);
    var label = document.createElement('span');
    label.textContent = isFraud ? 'Fraud' : 'Clean';
    chip.appendChild(label);
    td.appendChild(chip);
    return td;
  }

  // ---------------------------------------------------------------- STOMP
  var client = null, retry = 0;

  function setConn(state, label) {
    el['conn'].setAttribute('data-state', state);
    el['conn-text'].textContent = label;
  }

  function connect() {
    setConn('connecting', retry ? 'Reconnecting' : 'Connecting');
    var socket = new SockJS('/stomp');
    client = Stomp.over(socket);
    client.debug = null;           // no frame spam in the console

    client.connect({}, function () {
      retry = 0;
      setConn('live', 'Live');
      client.subscribe('/topic/fraudData', function (msg) {
        handle(msg, 'fraudAlert', true);
      });
      client.subscribe('/topic/nonFraudData', function (msg) {
        handle(msg, 'nonFraudAlert', false);
      });
    }, function () {
      setConn('down', 'Disconnected');
      retry++;
      setTimeout(connect, Math.min(15000, 1500 * retry));
    });
  }

  function handle(msg, field, isFraud) {
    var payload;
    try { payload = JSON.parse(msg.body); } catch (e) { return; }
    if (!payload) return;
    if (ingest(payload[field], isFraud)) render();
  }

  // ---------------------------------------------------------------- wiring
  function bindSegmented(group, key, cast) {
    group.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var buttons = group.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute('aria-pressed', String(buttons[i] === btn));
      }
      filters[key] = cast(btn.getAttribute('data-' + key));
      render();
    });
  }

  bindSegmented(el['window-filter'], 'window', Number);
  bindSegmented(el['stream-filter'], 'stream', String);

  var searchTimer = null;
  el['search'].addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      filters.query = el['search'].value.trim().toLowerCase();
      render();
    }, 140);
  });

  function bindTableToggle(btn, panel) {
    btn.addEventListener('click', function () {
      var show = panel.hasAttribute('hidden');
      if (show) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', String(show));
      btn.textContent = show ? 'Chart' : 'Table';
    });
  }
  bindTableToggle(el['toggle-table-throughput'], el['table-throughput']);
  bindTableToggle(el['toggle-table-category'], el['table-category']);

  // theme: explicit choice wins over the OS setting, and persists
  var stored = null;
  try { stored = localStorage.getItem('sentinel-theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  el['theme-toggle'].addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) {
      cur = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('sentinel-theme', next); } catch (e) {}
    refreshColors();
    render();
  });

  function tickClock() {
    var d = new Date();
    el['clock'].textContent = d.toTimeString().slice(0, 8);
  }

  window.addEventListener('resize', function () {
    hideThroughputTip();
    el['tip-category'].removeAttribute('data-show');
  });

  // ------------------------------------------------------------------ boot
  refreshColors();
  tickClock();
  setInterval(tickClock, 1000);
  setInterval(sampleTick, TICK_MS);
  render();
  connect();
})();

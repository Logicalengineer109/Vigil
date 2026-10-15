# Vigil

A real-time credit card fraud detection pipeline that streams transactions through Kafka
and Spark, scores them with a Random Forest model, and surfaces the verdicts live on a
Cassandra-backed dashboard.

![architecture](./src/architecture.png)

## How it works

Transactions are published to Kafka, consumed by a Spark Streaming job on a 5-second
batch interval, enriched against customer records in Cassandra (deriving the cardholder's
**age** and the **distance** between them and the merchant), then classified by a
pre-trained Random Forest. Fraud and non-fraud records are written to separate Cassandra
tables, and the max Kafka offset per partition is committed in the same pass — with
`(cc_num, trans_time)` as the primary key, replays are idempotent.

A Spring Boot app polls those tables and pushes new rows to the browser over STOMP/SockJS.
A small Flask service exposes customer lookups and transaction statements.

For the full design write-up — feature engineering, the K-means class balancing, the ML
pipeline stages — see [docs/pipeline-design.md](./docs/pipeline-design.md).

## Stack

| Component | Version | Notes |
|---|---|---|
| Spark | 2.2.1 (Scala 2.11) | streaming + MLlib |
| Kafka | 0.10 / 1.1 client | topic `creditcardTransaction`, 3 partitions |
| Cassandra | 3.11 | keyspace `creditcard` |
| Spring Boot | 1.5.12 | dashboard + WebSocket |
| Flask | 2.2.x | REST API |
| **Java** | **8 — required** | Spark 2.2 and Spring Boot 1.5 both fail on 11+ |

## Layout

```
Fraud Detection/        Spark jobs (Scala): import, training, streaming
Creditcard Producer/    Kafka producer (Scala) — replays transactions.csv as JSON
Fraud Alert Dashboard/  Spring Boot + the Sentinel web console
Cassandra Python/       Flask REST API
Cassandra Keyspace.cql  schema
local-run/              scripts to run the whole thing locally
```

## Running locally

**Prerequisites:** Docker, and a Java 8 JDK, Spark 2.2.1 and Maven 3.6.x placed under
`~/frauddetection/toolchain/` as `jdk8/`, `spark-2.2.1/` and `maven/`. They live there
rather than system-wide so they don't disturb a newer system Java.

> Spark 2.2.1 is easiest to obtain from the `pyspark==2.2.1` sdist on PyPI, which bundles
> the identical distribution (`jars/`, `bin/spark-submit`). Add an empty `RELEASE` file at
> the Spark root or `bin/spark-class` will look for a source build instead of `jars/`.

```bash
cd local-run
./bootstrap.sh          # stage data + models into ~/frauddetection
```

`Config.scala` hardcodes `file:///$HOME/frauddetection/` as the data root, which is why
the CSVs and models are staged there rather than read from the repo.

Build the two Java/Scala apps, then seed Cassandra and train:

```bash
source local-run/env.sh
mvn -s "$MVN_SETTINGS" -DskipTests package   # in Creditcard Producer/ and Fraud Alert Dashboard/

spark-submit --class com.datamantra.spark.jobs.IntialImportToCassandra \
  --master "local[*]" "$JAR" "$CONF"
spark-submit --class com.datamantra.spark.jobs.FraudDetectionTraining \
  --master "local[*]" --driver-memory 4g "$JAR" "$CONF"
```

Then:

```bash
./local-run/start-all.sh    # everything up
./local-run/status.sh       # health check
./local-run/stop-all.sh     # down (--with-infra also stops containers)
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:8080 |
| Customer API | http://localhost:5050/api/customer/`<cc_num>` |
| Statement API | http://localhost:5050/api/statement/`<cc_num>` |
| Spark UI | http://localhost:4040 |

Use a `cc_num` that has transactions, e.g. `180036251237802`.

### Notes that will save you an hour

- **Maven needs the settings file** (`-s "$MVN_SETTINGS"`). The poms list the long-dead
  `http://scala-tools.org/repo-releases` first; its parked domain returns HTML that Maven
  caches as a corrupt POM and then fails to parse. The settings file mirrors everything to
  Central except Confluent.
- **The streaming job stops via a marker file**, not a signal: `touch /tmp/shutdownmarker`.
- **Retraining overwrites nothing** — `model.save()` throws if the path exists. Delete
  `spark/training/{PreprocessingModel,RandomForestModel}` first.
- The `age` feature is computed from the *current* date, so a model trained years ago
  scores against a shifted age distribution. Retrain rather than reusing stale models.

## Dashboard

`Fraud Alert Dashboard/src/main/resources/static/` is a console UI: stat tiles with
sparklines, a live throughput chart (clean vs fraud, crosshair tooltip), fraud-by-category
bars, and a filterable transaction feed. Dark-first with a persisted light toggle.

It uses only the vendored `sockjs` + `stomp` — no Bootstrap, jQuery or Chart.js — so the
page is self-contained and works offline. Charts are hand-rolled SVG. Fraud red and clean
blue are validated for colorblind separation against the dark surface, and the verdict is
always icon + label, never color alone. Kafka-sourced strings reach the DOM via
`textContent` only.

The feed's time column is labelled **IST**: the server's `@JsonFormat` renders
`trans_time` in IST. Window filters and the chart axis use arrival time instead, so they
are immune to that skew.

## Known issues

- `app.py::get_statement_by_id` returns HTTP 500 for a `cc_num` with no non-fraud
  transactions — `df.sort_values(by="trans_time")` raises `KeyError` on the empty frame.
  Its result is also discarded (`sort_values` is not in-place), so statements render in
  Cassandra clustering order rather than sorted.
- `flask_table` 0.5.0 imports `Markup` from `flask`, removed in Flask 2.3, which pins
  Flask to 2.2.x. `Table, Col` are imported in `app.py` but never used — dropping that
  import frees the pin.

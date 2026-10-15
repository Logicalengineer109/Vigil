#!/usr/bin/env bash
# Stop the pipeline. Pass --with-infra to also stop the containers.
source "$(dirname "$0")/env.sh"
cd "$FD_HOME"

echo "==> stopping Spark streaming job gracefully"
touch /tmp/shutdownmarker          # GracefulShutdown polls for this marker
for i in $(seq 1 20); do pgrep -f DstreamFraudDetection >/dev/null || break; sleep 2; done
pkill -f DstreamFraudDetection 2>/dev/null && echo "    forced stop"
rm -f /tmp/shutdownmarker

pkill -f TransactionProducer   2>/dev/null && echo "    producer stopped"
pkill -f fraud-alert-dashboard 2>/dev/null && echo "    dashboard stopped"
pkill -f "app\.py"             2>/dev/null && echo "    flask stopped"

if [ "${1:-}" = "--with-infra" ]; then
  docker compose -p fraud down
else
  echo "==> containers left running (--with-infra to stop them)"
fi

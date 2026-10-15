#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"
cd "$FD_HOME"
check() { printf "  %-26s %s\n" "$1" "$(pgrep -f "$2" >/dev/null 2>&1 && echo "UP (pid $(pgrep -f "$2" | head -1))" || echo DOWN)"; }
echo "PROCESSES"
check "Spark Streaming" "DstreamFraudDetection"
check "Kafka Producer"  "TransactionProducer"
check "Dashboard"       "fraud-alert-dashboard"
check "Flask API"       "app\.py"
echo; echo "CONTAINERS"
docker compose -p fraud ps --format "  {{.Name}}  {{.Status}}" 2>/dev/null
echo; echo "ENDPOINTS"
for u in http://127.0.0.1:8080/ http://127.0.0.1:5050/api/health http://127.0.0.1:4040/jobs/; do
  printf "  %-38s HTTP %s\n" "$u" "$(curl -sS -o /dev/null -m 10 -w '%{http_code}' "$u" 2>/dev/null)"
done
echo; echo "CASSANDRA ROW COUNTS"
for t in customer fraud_transaction non_fraud_transaction kafka_offset; do
  printf "  %-24s %s\n" "$t" "$(docker exec fraud-cassandra cqlsh -e "SELECT COUNT(*) FROM creditcard.$t;" 2>/dev/null | sed -n '4p' | tr -d ' ')"
done

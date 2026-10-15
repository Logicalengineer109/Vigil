#!/usr/bin/env bash
# Bring up the whole pipeline locally. Run ./bootstrap.sh once first.
set -euo pipefail
source "$(dirname "$0")/env.sh"
cd "$FD_HOME"

echo "==> 1/6 infrastructure (Kafka, Zookeeper, Cassandra)"
docker compose -p fraud up -d
echo "    waiting for Cassandra..."
until docker exec fraud-cassandra cqlsh -e "describe keyspaces" >/dev/null 2>&1; do sleep 3; done
echo "    waiting for Kafka..."
until docker exec fraud-kafka kafka-broker-api-versions --bootstrap-server localhost:29092 >/dev/null 2>&1; do sleep 3; done

echo "==> 2/6 schema + topic (idempotent)"
docker cp "$REPO_DIR/Cassandra Keyspace.cql" fraud-cassandra:/tmp/schema.cql >/dev/null
docker exec fraud-cassandra cqlsh -f /tmp/schema.cql
docker exec fraud-kafka kafka-topics --zookeeper fraud-zookeeper:2181 --create \
  --topic creditcardTransaction --replication-factor 1 --partitions 3 2>/dev/null || echo "    topic exists"

echo "==> 3/6 streaming job (Spark + ML models)"
rm -f /tmp/shutdownmarker
nohup spark-submit \
  --class com.datamantra.spark.jobs.RealTimeFraudDetection.DstreamFraudDetection \
  --master "local[*]" --name "Vigil Dstream Fraud Detection" \
  --driver-memory 3g --conf spark.ui.port=4040 \
  "$JAR" "$CONF" > logs/streaming.log 2>&1 &
until grep -q "JobScheduler: Added jobs for time" logs/streaming.log 2>/dev/null; do sleep 3; done

echo "==> 4/6 Kafka producer"
nohup java -cp "$REPO_DIR/Creditcard Producer/target/creditcard-tr-producer-1.0-SNAPSHOT-jar-with-dependencies.jar" \
  com.datamantra.producer.TransactionProducer "$FD_HOME/producer-local.conf" > logs/producer.log 2>&1 &

echo "==> 5/6 dashboard"
nohup java -jar "$REPO_DIR/Fraud Alert Dashboard/target/fraud-alert-dashboard-0.0.1-SNAPSHOT.jar" > logs/dashboard.log 2>&1 &

echo "==> 6/6 Flask REST API"
cd "$REPO_DIR/Cassandra Python"
nohup "$FD_HOME/venv/bin/python" app.py > "$FD_HOME/logs/flask.log" 2>&1 &

echo
echo "Dashboard http://localhost:8080  ·  API http://localhost:5050  ·  Spark UI http://localhost:4040"

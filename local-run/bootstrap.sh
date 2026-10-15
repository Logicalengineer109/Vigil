#!/usr/bin/env bash
# One-time setup: stage the pipeline's data and models into $FD_HOME.
# Config.scala hardcodes file:///$HOME/frauddetection/ as the data root, so the
# app only resolves its CSVs and ML models from there.
set -euo pipefail
source "$(dirname "$0")/env.sh"

mkdir -p "$FD_HOME"
cp -R "$REPO_DIR/Fraud Detection/build-files/." "$FD_HOME/"
mkdir -p "$FD_HOME/logs"
cp "$REPO_DIR/local-run/docker-compose.yml" "$FD_HOME/docker-compose.yml"

cat > "$FD_HOME/producer-local.conf" <<CONF
kafka {
  bootstrap.servers = "localhost:9092"
  key.serializer = "org.apache.kafka.common.serialization.StringSerializer"
  value.serializer = "org.apache.kafka.common.serialization.StringSerializer"
  acks = "all"
  retries = "3"
  topic = "creditcardTransaction"
  producer.file = "$REPO_DIR/Creditcard Producer/src/main/resources/transactions.csv"
}
CONF

mkdir -p "$FD_HOME/toolchain/maven-conf"
cat > "$FD_HOME/toolchain/maven-conf/settings.xml" <<'CONF'
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0">
  <mirrors>
    <!-- scala-tools.org is dead; its parked domain returns HTML that Maven
         caches as a corrupt POM. Route everything to Central except Confluent. -->
    <mirror>
      <id>central-only</id>
      <url>https://repo.maven.apache.org/maven2</url>
      <mirrorOf>*,!confluent</mirrorOf>
    </mirror>
    <mirror>
      <id>confluent-https</id>
      <url>https://packages.confluent.io/maven/</url>
      <mirrorOf>confluent</mirrorOf>
    </mirror>
  </mirrors>
</settings>
CONF

echo "Staged into $FD_HOME"
echo "Still required in \$FD_HOME/toolchain/: jdk8, spark-2.2.1, maven  (see README)"

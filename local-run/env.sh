#!/usr/bin/env bash
# Environment for the Vigil pipeline.
# Spark 2.2.1 / Scala 2.11 and Spring Boot 1.5.x both require Java 8.
export REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export FD_HOME="${FD_HOME:-$HOME/frauddetection}"

export JAVA_HOME="${JAVA_HOME:-$FD_HOME/toolchain/jdk8}"
export SPARK_HOME="${SPARK_HOME:-$FD_HOME/toolchain/spark-2.2.1}"
export M2_HOME="${M2_HOME:-$FD_HOME/toolchain/maven}"
export PATH="$JAVA_HOME/bin:$SPARK_HOME/bin:$M2_HOME/bin:$PATH"

export SPARK_LOCAL_IP=127.0.0.1
export CONF="$FD_HOME/spark/application-local.conf"
export JAR="$FD_HOME/spark/fruaddetection-spark.jar"
export MVN_SETTINGS="$FD_HOME/toolchain/maven-conf/settings.xml"

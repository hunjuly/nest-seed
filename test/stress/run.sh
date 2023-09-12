#!/bin/bash
set -e
cd "$(dirname "$0")"

clear
echo "🚀 Starting infra..."
echo "$(bash ../../scripts/infra_up.sh)"
echo "$(bash ../../scripts/run_container.sh)"
echo "Infra is running"

# 현재 작업 중인 디렉터리 (pwd)에서 $WORKSPACE_ROOT을 제거
RELATIVE_PATH=${PWD#$WORKSPACE_ROOT}
# 결과값을 $HOST_PATH와 결합
CURRENT_HOST_PATH="$HOST_PATH$RELATIVE_PATH"

CONTAINER_NAME=$PROJECT_NAME-jmeter

docker build -t jmeter .

rm -f results.jtl

docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1

docker run --network $PROJECT_NAME --rm --name ${CONTAINER_NAME} \
    -v ${CURRENT_HOST_PATH}:/workspace -w /workspace \
    jmeter \
    -n -t HTTPRequest.jmx -l ./results.jtl -j ./logfile.log \
    -Jdomain=$PROJECT_NAME -Jport=3000

#!/bin/bash
set -e
cd "$(dirname "$0")"

# 현재 작업 중인 디렉터리 (pwd)에서 $WORKSPACE_ROOT을 제거
RELATIVE_PATH=${PWD#$WORKSPACE_ROOT}
# 결과값을 $HOST_PATH와 결합
CURRENT_HOST_PATH="$HOST_PATH$RELATIVE_PATH"

CONTAINER_NAME=$(basename $WORKSPACE_ROOT)-jmeter

docker build -t jmeter .

rm -f results.jtl

docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1
docker run --network nestjs-seed --rm --name ${CONTAINER_NAME} \
    -v ${CURRENT_HOST_PATH}:/workspace -w /workspace jmeter -n \
    -t HTTPRequest.jmx -l ./results.jtl -j ./logfile.log

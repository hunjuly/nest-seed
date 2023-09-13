#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

check_application_start() (
  local TIMEOUT=10
  local COUNTER=0

  while ! docker logs $PROJECT_NAME 2>&1 | grep -q "Application is running on:"; do
    if [ $COUNTER -ge $TIMEOUT ]; then
      echo "Error: Application did not start within $TIMEOUT seconds."
      return 1
    fi

    echo "Waiting for application to start..."
    sleep 1 # 1초 간격으로 확인
    COUNTER=$((COUNTER+1))
  done

  echo "Application has started!"
  return 0
)

docker_compose stop service
docker_compose rm -f service
docker_compose up -d service

check_application_start $PROJECT_NAME

docker logs $PROJECT_NAME

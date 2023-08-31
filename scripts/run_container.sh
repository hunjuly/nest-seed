#!/bin/bash
cd "$(dirname "$0")"
cd ..

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

docker build -t $PROJECT_NAME .
docker rm -f $PROJECT_NAME
docker run \
--restart=always -d --network $PROJECT_NAME \
--log-opt max-size=10m --log-opt max-file=3 \
--env-file .env.development \
-e NODE_ENV=production \
-v ./logs:/app/logs \
--name $PROJECT_NAME \
$PROJECT_NAME

check_application_start $PROJECT_NAME

docker logs $PROJECT_NAME

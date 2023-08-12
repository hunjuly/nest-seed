#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

REDIS_IMAGE="redis:7.0-alpine"

start_redis() {
    docker rm -f $CACHE_HOST >/dev/null 2>&1
    docker run --rm -d --network $PROJECT_NAME \
        --name $CACHE_HOST \
        $REDIS_IMAGE
}

start_redis

#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..

VERSION=$(jq -r '.version' package.json)
NAME=$(jq -r '.name' package.json)
DOCKER_IMAGE="$NAME:$VERSION"
NETWORK="--network $(basename $(pwd))"

docker rm -f "$NAME" >/dev/null 2>&1

# docker build -t $DOCKER_IMAGE .
docker build -t nestjs-seed:1.0 https://github.com/hunjuly/nestjs-seed.git#main

docker run --rm -d $NETWORK \
    --name "$NAME" \
    --env-file .env.development \
    -e NODE_ENV=production \
    -v $(pwd)/logs:/app/logs \
    $DOCKER_IMAGE

docker logs -f "$NAME"

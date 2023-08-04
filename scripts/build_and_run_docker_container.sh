#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

VERSION=$(jq -r '.version' package.json)
NAME=$(jq -r '.name' package.json)
DOCKER_IMAGE="$NAME:$VERSION"
NETWORK="--network $(basename $(pwd))"

npm run build:docker

docker rm -f "$NAME" >/dev/null 2>&1

docker run --rm -d $NETWORK \
    --name "$NAME" \
    --env-file .env \
    -e NODE_ENV=production \
    -v $(pwd)/logs:/app/logs \
    $DOCKER_IMAGE

docker logs -f "$NAME"

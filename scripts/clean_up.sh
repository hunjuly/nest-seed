#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

VERSION=$(jq -r '.version' package.json)
NAME=$(jq -r '.name' package.json)
DOCKER_IMAGE="$NAME:$VERSION"

docker rm -f $CACHE_HOST
docker rm -f $TYPEORM_HOST
docker rmi -f $DOCKER_IMAGE

docker system prune -f
docker volume prune -f

rm -rf dist coverage logs config

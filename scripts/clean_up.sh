#!/bin/bash
set -ex
cd "$(dirname "$0")"

VERSION=$(jq -r '.version' ../package.json)
NAME=$(jq -r '.name' ../package.json)
DOCKER_IMAGE="$NAME:$VERSION"

docker rmi -f $DOCKER_IMAGE

docker-compose --env-file ../.env.development down

docker system prune -f
docker volume prune -f

cd ..
rm -rf dist coverage logs config node_modules

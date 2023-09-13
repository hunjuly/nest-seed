#!/bin/bash
set -e
source "$(dirname "$0")"/common.cfg

VERSION=$(jq -r '.version' $WORKSPACE_ROOT/package.json)
NAME=$(jq -r '.name' $WORKSPACE_ROOT/package.json)
DOCKER_IMAGE="$NAME:$VERSION"

docker rmi -f $DOCKER_IMAGE

docker_compose down

docker system prune -f
docker volume prune -f

for dir in dist coverage logs config node_modules; do
    rm -rf "$WORKSPACE_ROOT/$dir"
done

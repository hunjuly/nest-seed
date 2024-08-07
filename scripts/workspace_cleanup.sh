#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

docker_compose --profile service --profile infra down --rmi all

for dir in dist coverage logs uploads node_modules; do
    rm -rf "$WORKSPACE_ROOT/$dir"
done

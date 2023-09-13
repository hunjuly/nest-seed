#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

docker_compose --profile infra down
docker_compose --profile infra up -d

bash $SCRIPTS_PATH/init_database.sh

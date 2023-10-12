#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

bash $SCRIPTS_PATH/init_database.sh
bash $SCRIPTS_PATH/set_allow_schema_reset.sh

mkdir -p $WORKSPACE_ROOT/logs
npm ci --prefix $WORKSPACE_ROOT

docker logs mongo
docker logs postgres

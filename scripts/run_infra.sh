#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

run_psql() (
    docker exec $POSTGRES_DB_HOST psql -U ${POSTGRES_DB_USERNAME} -d $POSTGRES_DB_DATABASE -w "$@"
)

docker_compose --profile infra down
docker_compose --profile infra up -d

wait_for_service $POSTGRES_DB_HOST "run_psql -c 'SELECT 1' >/dev/null 2>&1"

run_psql -c "CREATE SCHEMA $POSTGRES_DB_SCHEMA AUTHORIZATION $POSTGRES_DB_USERNAME;"

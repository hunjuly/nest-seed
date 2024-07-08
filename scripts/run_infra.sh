#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

run_psql() (
  docker exec $POSTGRES_DB_HOST psql -U ${POSTGRES_DB_USERNAME} -d $POSTGRES_DB_DATABASE -w "$@"
)

run_mongo() (
  docker logs ${MONGO_DB_HOST1}
  docker exec ${MONGO_DB_HOST1} mongosh -u ${MONGO_DB_USERNAME} -p ${MONGO_DB_PASSWORD} --authenticationDatabase admin --eval "$@"
)

docker_compose --profile infra down
docker volume rm mongodb_key

docker run --rm -v mongodb_key:/mongodb_key -w /mongodb_key mongo sh -c "openssl rand -base64 768 >mongodb.key && chmod 400 /mongodb_key/mongodb.key && chown mongodb:mongodb /mongodb_key/mongodb.key"
docker_compose --profile infra up -d

wait_for_service "${MONGO_DB_HOST1}" "run_mongo 'db.version()'"
run_mongo "
rs.initiate({
    _id: \"${MONGO_DB_REPLICA_NAME}\",
    members: [
        {_id: 0, host: \"${MONGO_DB_HOST1}\"},
        {_id: 1, host: \"${MONGO_DB_HOST2}\"},
        {_id: 2, host: \"${MONGO_DB_HOST3}\"}
    ]
})
"

wait_for_service $POSTGRES_DB_HOST "run_psql -c 'SELECT 1' >/dev/null 2>&1"
run_psql -c "CREATE SCHEMA $POSTGRES_DB_SCHEMA AUTHORIZATION $POSTGRES_DB_USERNAME;"

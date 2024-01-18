#!/bin/bash
set -ex
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

run_psql() {
    export LANG=C.UTF-8
    export PGPASSWORD=postgres_password
    psql -h $POSTGRES_DB_HOST -d $POSTGRES_DB_DATABASE -U ${POSTGRES_DB_USERNAME} -w "$@"
}

wait_for_postgresql() {
    count=0
    max_retries=10 # 최대 시도 횟수 설정
    until run_psql -c 'SELECT 1' >/dev/null 2>&1; do
        sleep 1

        count=$((count + 1))
        echo "Waiting for PostgreSQL... $count seconds"

        if [ $count -gt $max_retries ]; then
            echo "Error: Maximum retries exceeded. Exiting."
            exit 1
        fi
    done

    sleep 1

    echo "PostgreSQL has started."
}

docker_compose --profile infra down
docker_compose --profile infra up -d

wait_for_postgresql

run_psql -c "CREATE SCHEMA $POSTGRES_DB_SCHEMA AUTHORIZATION $POSTGRES_DB_USERNAME;"

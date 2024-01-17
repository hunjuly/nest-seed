#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

run_psql() {
    export PGPASSWORD=postgres_password
    psql -h $POSTGRES_DB_HOST -U postgres -w "$@"
}

wait_for_postgresql() {
    count=0
    max_retries=10  # 최대 시도 횟수 설정
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

run_psql -c "CREATE DATABASE $POSTGRES_DB_DATABASE;"
run_psql -d $POSTGRES_DB_DATABASE -c "CREATE USER $POSTGRES_DB_USERNAME WITH PASSWORD '$POSTGRES_DB_PASSWORD';"
run_psql -d $POSTGRES_DB_DATABASE -c "ALTER DATABASE $POSTGRES_DB_DATABASE OWNER TO $POSTGRES_DB_USERNAME;"
run_psql -d $POSTGRES_DB_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB_DATABASE TO $POSTGRES_DB_USERNAME;"
run_psql -d $POSTGRES_DB_DATABASE -c "CREATE SCHEMA $POSTGRES_DB_SCHEMA AUTHORIZATION $POSTGRES_DB_USERNAME;"
run_psql -d $POSTGRES_DB_DATABASE -c "GRANT ALL ON SCHEMA $POSTGRES_DB_SCHEMA TO $POSTGRES_DB_USERNAME WITH GRANT OPTION;"

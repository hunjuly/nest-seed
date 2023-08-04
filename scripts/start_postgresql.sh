#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

NETWORK="--network $(basename $(pwd))"
POSTGRES_IMAGE="postgres:15-alpine3.18"

start_postgresql() {
    local port=5432

    while :; do
        docker rm -f $TYPEORM_HOST >/dev/null 2>&1

        set +e
        output=$(docker run --rm -d $NETWORK \
            --name $TYPEORM_HOST \
            -e POSTGRES_PASSWORD="postgres" \
            -p $port:5432 \
            $POSTGRES_IMAGE 2>&1)
        set -e

        if [[ $output != *"port is already allocated"* ]]; then
            echo "PostgreSQL is running on port $port"
            break
        else
            echo "Port $port is already in use. Trying next port..."
            port=$((port + 1))
        fi
    done
}

run_psql() {
    docker exec $TYPEORM_HOST psql -U postgres "$@"
}

wait_for_postgresql() {
    count=0
    until run_psql -c 'SELECT 1' >/dev/null 2>&1; do
        sleep 1

        count=$((count + 1))
        echo "Waiting for PostgreSQL... $count seconds"
    done

    sleep 1

    echo "PostgreSQL has started."
}

init_database() {
    run_psql -c "CREATE DATABASE $TYPEORM_DATABASE;"

    run_psql -d $TYPEORM_DATABASE -c "CREATE USER $TYPEORM_USERNAME WITH PASSWORD '$TYPEORM_PASSWORD';"
    run_psql -d $TYPEORM_DATABASE -c "ALTER DATABASE $TYPEORM_DATABASE OWNER TO $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $TYPEORM_DATABASE TO $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"
}

start_postgresql
wait_for_postgresql
init_database

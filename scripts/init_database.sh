#!/bin/bash
set -e
cd "$(dirname "$0")"

. ../.env.development

run_psql() {
    export PGPASSWORD=postgres_password
    psql -h $TYPEORM_HOST -U postgres -w "$@"
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

wait_for_postgresql

run_psql -c "CREATE DATABASE $TYPEORM_DATABASE;"
run_psql -d $TYPEORM_DATABASE -c "CREATE USER $TYPEORM_USERNAME WITH PASSWORD '$TYPEORM_PASSWORD';"
run_psql -d $TYPEORM_DATABASE -c "ALTER DATABASE $TYPEORM_DATABASE OWNER TO $TYPEORM_USERNAME;"
run_psql -d $TYPEORM_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $TYPEORM_DATABASE TO $TYPEORM_USERNAME;"
run_psql -d $TYPEORM_DATABASE -c "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
run_psql -d $TYPEORM_DATABASE -c "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"

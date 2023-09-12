#!/bin/bash
set -e
cd "$(dirname "$0")"

. ../.env.development

wait_for_postgresql() {
    count=0
    until run_psql 'SELECT 1' >/dev/null 2>&1; do
        sleep 1

        count=$((count + 1))
        echo "Waiting for PostgreSQL... $count seconds"
    done

    sleep 1

    echo "PostgreSQL has started."
}

run_psql() {
    export PGPASSWORD=${TYPEORM_PASSWORD}

    psql -h $TYPEORM_HOST -U $TYPEORM_USERNAME -w -d $TYPEORM_DATABASE -c "$@"
}

wait_for_postgresql

# run_psql "ALTER DATABASE $TYPEORM_DATABASE OWNER TO $TYPEORM_USERNAME;"
# run_psql "GRANT ALL PRIVILEGES ON DATABASE $TYPEORM_DATABASE TO $TYPEORM_USERNAME;"
run_psql "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
run_psql "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"

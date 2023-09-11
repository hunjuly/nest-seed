#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

run_psql() {
    # docker exec $TYPEORM_HOST psql -U postgres "$@"
    PGPASSWORD=postgres psql -h $TYPEORM_HOST -U postgres -w "$@"
}

init_database() {
    # run_psql -c "CREATE DATABASE $TYPEORM_DATABASE;"

    # run_psql -d $TYPEORM_DATABASE -c "CREATE USER $TYPEORM_USERNAME WITH PASSWORD '$TYPEORM_PASSWORD';"
    # run_psql -d $TYPEORM_DATABASE -c "ALTER DATABASE $TYPEORM_DATABASE OWNER TO $TYPEORM_USERNAME;"
    # run_psql -d $TYPEORM_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $TYPEORM_DATABASE TO $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"
}

init_database

#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

run_psql() {
    export PGPASSWORD=$TYPEORM_PASSWORD
    psql -h $TYPEORM_HOST -U $TYPEORM_USERNAME -w "$@"
}

init_database() {
    run_psql -d $TYPEORM_DATABASE -c "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"
}

init_database

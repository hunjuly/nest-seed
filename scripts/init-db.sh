#!/bin/bash
set -e

export PGPASSWORD=password

# psql -U "$POSTGRES_USER" -d $POSTGRES_DB <<-EOSQL
psql -U "$POSTGRES_USER" -d $POSTGRES_DB CREATE SCHEMA $POSTGRES_SCHEMA AUTHORIZATION $POSTGRES_USER;
psql -U "$POSTGRES_USER" -d $POSTGRES_DB GRANT ALL ON SCHEMA $POSTGRES_SCHEMA TO $POSTGRES_USER WITH GRANT OPTION;
# EOSQL

#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..

docker-compose --env-file ./.env.development up -d

# bash scripts/start_redis.sh
# bash scripts/start_postgresql.sh
# bash scripts/init_database.sh

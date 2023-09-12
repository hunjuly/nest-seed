#!/bin/bash
set -ex
cd "$(dirname "$0")"

docker-compose --env-file ../.env.development stop db redis
docker-compose --env-file ../.env.development rm -f db redis

docker-compose --env-file ../.env.development up -d db redis

bash init_database.sh

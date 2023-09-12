#!/bin/bash
set -ex
cd "$(dirname "$0")"

docker-compose --env-file ../.env.development down
docker-compose --env-file ../.env.development up -d

bash init_database.sh

#!/bin/bash
set -ex
cd "$(dirname "$0")"

# github action은 자체적으로 실행한다.
if [ "$GITHUB_ACTIONS" != "true" ]; then
    docker-compose --env-file ../.env.development stop db redis
    docker-compose --env-file ../.env.development rm -f db redis

    docker-compose --env-file ../.env.development up -d db redis
fi

bash init_database.sh

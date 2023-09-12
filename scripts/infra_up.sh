#!/bin/bash
set -ex
cd "$(dirname "$0")"

# github action은 자체적으로 실행한다.
if [ "$GITHUB_ACTIONS" != "true" ]; then
  docker-compose --env-file ../.env.development down
  docker-compose --env-file ../.env.development up -d
fi

bash init_database.sh

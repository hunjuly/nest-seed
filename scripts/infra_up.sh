#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..

bash scripts/start_redis.sh
bash scripts/start_postgresql.sh
bash scripts/init_database.sh

npm run build
npm run migration:run

mkdir -p logs

#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

# 'npm run migration:run'을 실행하면 아래의 process.env.TYPEORM_*을 실행한다.
# 그러나 .env.development를 로딩하게 할 수 없어서 아래처럼 export를 한다.
# export TYPEORM_DATABASE=$TYPEORM_DATABASE
# export TYPEORM_SCHEMA=$TYPEORM_SCHEMA
# export TYPEORM_HOST=$TYPEORM_HOST
# export TYPEORM_PORT=$TYPEORM_PORT
# export TYPEORM_USERNAME=$TYPEORM_USERNAME
# export TYPEORM_PASSWORD=$TYPEORM_PASSWORD
# export TYPEORM_POOL_SIZE=$TYPEORM_POOL_SIZE

VERSION=$(jq -r '.version' package.json)
NAME=$(jq -r '.name' package.json)
DOCKER_IMAGE="$NAME:$VERSION"

NETWORK="--network $(basename $(pwd))"
REDIS_IMAGE="redis:7.0-alpine"
POSTGRES_IMAGE="postgres:15-alpine3.18"

start_redis() {
    docker rm -f $CACHE_HOST >/dev/null 2>&1
    docker run --rm -d $NETWORK \
        --name $CACHE_HOST \
        $REDIS_IMAGE
}

start_postgresql() {
    docker rm -f $TYPEORM_HOST >/dev/null 2>&1
    docker run --rm -d $NETWORK \
        --name $TYPEORM_HOST \
        -e POSTGRES_PASSWORD="postgres" \
        -p 5432:5432 \
        $POSTGRES_IMAGE

}

run_psql() {
    docker exec $TYPEORM_HOST psql -U postgres "$@"
}

wait_for_postgresql() {
    count=0
    until run_psql -c 'SELECT 1' >/dev/null 2>&1; do
        sleep 1

        count=$((count + 1))
        echo "Waiting for PostgreSQL... $count seconds"
    done

    echo "PostgreSQL has started."
}

launch_psql() {
    clear

    echo "-----------------------------------------------"
    echo "# 스키마 설정"
    echo "SET search_path TO $TYPEORM_SCHEMA;"
    echo ""
    echo "# Expanded display"
    echo "\x;"
    echo ""
    echo "# 테이블 목록"
    echo "\dt;"
    echo ""
    echo "# 테이블 정보"
    echo "\d+ seed;"
    echo ""
    echo "# 쿼리 실행"
    echo "select * from seed;"
    echo ""
    echo "# superuser 권한 부여"
    echo "psql -d $TYPEORM_DATABASE -c \"ALTER USER $TYPEORM_USERNAME WITH SUPERUSER;\""
    echo "-----------------------------------------------"

    docker exec -it $TYPEORM_HOST psql -U postgres -d $TYPEORM_DATABASE
}

init_database() {
    run_psql -c "CREATE DATABASE $TYPEORM_DATABASE;"

    run_psql -d $TYPEORM_DATABASE -c "CREATE USER $TYPEORM_USERNAME WITH PASSWORD '$TYPEORM_PASSWORD';"
    run_psql -d $TYPEORM_DATABASE -c "ALTER DATABASE $TYPEORM_DATABASE OWNER TO $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $TYPEORM_DATABASE TO $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
    run_psql -d $TYPEORM_DATABASE -c "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"
}

infra_up() {
    start_redis
    start_postgresql
    wait_for_postgresql

    init_database

    npm run build

    npm run migration:run

    mkdir -p logs
}

clean_up() {
    docker rm -f $CACHE_HOST
    docker rm -f $TYPEORM_HOST
    docker rmi -f $DOCKER_IMAGE

    docker system prune -f
    docker volume prune -f

    rm -rf dist coverage logs
}

builder_and_run_docker_container() {
    infra_up

    npm run build:docker

    docker rm -f "$NAME" >/dev/null 2>&1

    docker run --rm -d $NETWORK \
        --name "$NAME" \
        --env-file .env \
        -e NODE_ENV=production \
        -v $(pwd)/logs:/app/logs \
        $DOCKER_IMAGE

    docker logs -f "$NAME"
}

clear

if [ -z "$1" ]; then
    echo "Select an action:"
    echo "1. Infra Up"
    echo "2. Run PSQL"
    echo "3. build & run docker container"
    echo "0. Clean up"
    echo ""

    read -p "Enter your choice: " choice

    case $choice in
    1)
        infra_up
        ;;
    2)
        launch_psql
        ;;
    3)
        builder_and_run_docker_container
        ;;
    0)
        clean_up
        ;;
    *)
        echo "Invalid choice."
        ;;
    esac
else
    case $1 in
    infra_up)
        infra_up
        ;;
    clean_up)
        clean_up
        ;;
    *)
        echo "Invalid argument."
        ;;
    esac
fi

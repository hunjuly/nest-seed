# common.cfg
if [ -z "$WORKSPACE_ROOT" ]; then
    echo "WORKSPACE_ROOT is not set. Exiting."
    exit 1
fi

docker_compose() {
    docker compose -f $WORKSPACE_ROOT/docker-compose.yml --env-file $WORKSPACE_ROOT/.env.development $@
}

ENV_FILE="$WORKSPACE_ROOT/.env.development"
SCRIPTS_PATH="$WORKSPACE_ROOT/scripts"

# clean_up.sh
#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

docker_compose down --rmi all

docker system prune -f
docker volume prune -f

for dir in dist coverage logs config node_modules; do
    rm -rf "$WORKSPACE_ROOT/$dir"
done

# infra_up.sh
#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

docker_compose --profile infra down
docker_compose --profile infra up -d

bash $SCRIPTS_PATH/init_database.sh

# init_database.sh
#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

run_psql() {
    export PGPASSWORD=postgres_password
    psql -h $TYPEORM_HOST -U postgres -w "$@"
}

wait_for_postgresql() {
    count=0
    max_retries=10  # 최대 시도 횟수 설정
    until run_psql -c 'SELECT 1' >/dev/null 2>&1; do
        sleep 1

        count=$((count + 1))
        echo "Waiting for PostgreSQL... $count seconds"

        if [ $count -gt $max_retries ]; then
            echo "Error: Maximum retries exceeded. Exiting."
            exit 1
        fi
    done

    sleep 1

    echo "PostgreSQL has started."
}

wait_for_postgresql

run_psql -c "CREATE DATABASE $TYPEORM_DATABASE;"
run_psql -d $TYPEORM_DATABASE -c "CREATE USER $TYPEORM_USERNAME WITH PASSWORD '$TYPEORM_PASSWORD';"
run_psql -d $TYPEORM_DATABASE -c "ALTER DATABASE $TYPEORM_DATABASE OWNER TO $TYPEORM_USERNAME;"
run_psql -d $TYPEORM_DATABASE -c "GRANT ALL PRIVILEGES ON DATABASE $TYPEORM_DATABASE TO $TYPEORM_USERNAME;"
run_psql -d $TYPEORM_DATABASE -c "CREATE SCHEMA $TYPEORM_SCHEMA AUTHORIZATION $TYPEORM_USERNAME;"
run_psql -d $TYPEORM_DATABASE -c "GRANT ALL ON SCHEMA $TYPEORM_SCHEMA TO $TYPEORM_USERNAME WITH GRANT OPTION;"

# init_dev_env.sh
set -e
. "$(dirname "$0")"/common.cfg

bash $SCRIPTS_PATH/infra_up.sh
bash $SCRIPTS_PATH/set_allow_schema_reset.sh

mkdir -p $WORKSPACE_ROOT/logs
npm install --prefix $WORKSPACE_ROOT

# test_container_in_production.sh
#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

check_application_start() (
    local TIMEOUT=10
    local COUNTER=0

    while ! docker logs $PROJECT_NAME 2>&1 | grep -q "Application is running on:"; do
        if [ $COUNTER -ge $TIMEOUT ]; then
            echo "Error: Application did not start within $TIMEOUT seconds."
            return 1
        fi

        echo "Waiting for application to start..."
        sleep 1 # 1초 간격으로 확인
        COUNTER=$((COUNTER + 1))
    done

    echo "Application has started!"
    return 0
)

docker_compose stop service
docker_compose rm -f service
docker_compose up -d --build service

docker exec $PROJECT_NAME npm run migration:run

check_application_start $PROJECT_NAME

docker logs $PROJECT_NAME

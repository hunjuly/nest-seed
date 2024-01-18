#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

clear

echo "-----------------------------------------------"
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
echo "psql -d $POSTGRES_DB_DATABASE -c \"ALTER USER $POSTGRES_DB_USERNAME WITH SUPERUSER;\""
echo ""
echo "# 스키마 설정"
echo "SET search_path TO $POSTGRES_DB_SCHEMA;"
echo "-----------------------------------------------"

docker exec -it $POSTGRES_DB_HOST psql -U ${POSTGRES_DB_USERNAME} -d $POSTGRES_DB_DATABASE

launch_psql

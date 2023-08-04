#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..
. ./.env.development

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

launch_psql

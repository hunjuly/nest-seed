#!/bin/bash
set -e
. ./common.cfg

reset_all
create_user_and_login

echo "Access Token 재발급 요청"
POST /auth/refresh \
    -H 'Content-Type: application/json' \
    -d '{
            "refreshToken": "'$REFRESH_TOKEN'"
        }'

ACCESS_TOKEN=$(echo $BODY | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $BODY | jq -r '.refreshToken')

echo "Access Token 테스트"
GET /auth/jwt-testing \
    -H "Authorization: Bearer $ACCESS_TOKEN"

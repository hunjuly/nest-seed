#!/bin/bash
set -e
. ./common.cfg

reset_all
create_user_and_login

TITLE "사용자 조회"
GET /users/$USER_ID \
    -H "Authorization: Bearer $ACCESS_TOKEN"

TITLE "모든 사용자 조회"
GET /users \
    -H "Authorization: Bearer $ACCESS_TOKEN" \

TITLE "user 업데이트"
PATCH /users/$USER_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
            "username": "UserName#2",
            "firstName": "FirstName#2",
            "lastName": "LastName#2",
            "birthdate": "2000-01-01T00:00:00.000Z"
        }'

TITLE "특정 ID를 가진 사용자 삭제"
DELETE /users/$USER_ID \
    -H "Authorization: Bearer $ACCESS_TOKEN"

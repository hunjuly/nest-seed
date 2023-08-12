#!/bin/bash
set -e
cd "$(dirname "$0")"
. ./common.cfg

reset_all
create_user_and_login

# Access Token 재발급 요청
res=$(
    POST /users/refresh \
        -H 'Content-Type: application/json' \
        -d '{
                "refreshToken": "'$REFRESH_TOKEN'"
            }'
)

ACCESS_TOKEN=$(echo $res | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $res | jq -r '.refreshToken')

# Access Token을 사용해서 개인 정보 요청
res=$(
    GET /users/$USER_ID \
        -H "Authorization: Bearer $ACCESS_TOKEN"
)

# 모든 사용자 조회
res=$(GET /users)

# user 업데이트
res=$(
    PATCH /users/$USER_ID \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
                "username": "UserName#2",
                "firstName": "FirstName#2",
                "lastName": "LastName#2",
                "birthdate": "2000-01-01T00:00:00.000Z"
            }'
)

# 특정 ID를 가진 사용자 삭제
res=$(
    DELETE /users/$USER_ID \
        -H "Authorization: Bearer $ACCESS_TOKEN"
)

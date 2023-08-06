#!/bin/bash
cd "$(dirname "$0")"
. ./common.cfg

res=$(
    POST /users \
        -H 'Content-Type: application/json' \
        -d '{
                "email": "test@test.com",
                "password": "testpassword",
                "birthdate": "1990-01-01",
                "username": "testUser",
                "firstName": "testFirstName",
                "lastName": "testLastName"
            }'
)

# 1. 로그인
res=$(
    POST /auth/login \
        -H 'Content-Type: application/json' \
        -d '{
                "email": "test@test.com",
                "password": "testpassword"
            }'
)

ACCESS_TOKEN=$(echo $res | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $res | jq -r '.refreshToken')

# 2. Access Token을 이용한 profile 요청
res=$(
    GET /auth/profile \
        -H "Authorization: Bearer $ACCESS_TOKEN"
)

# 3. Access Token 재발급 요청
res=$(
    POST /auth/refresh \
        -H 'Content-Type: application/json' \
        -d '{
                "refreshToken": "'$REFRESH_TOKEN'"
            }'
)

ACCESS_TOKEN=$(echo $res | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $res | jq -r '.refreshToken')

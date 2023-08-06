#!/bin/bash
cd "$(dirname "$0")"
. ./common.cfg$()

# 새로운 사용자 생성
# email (문자열): 사용자의 이메일
# username (문자열): 사용자의 사용자명
# firstName (문자열): 사용자의 이름
# lastName (문자열): 사용자의 성
# birthdate (날짜): 사용자의 생일
# password (문자열): 사용자의 비밀번호
res=$(
    POST /users \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testUser@example.com",
            "username": "testUser",
            "firstName": "Test",
            "lastName": "User",
            "birthdate": "2000-01-01T00:00:00.000Z",
            "password": "testPassword"
        }'
)
id=$(echo $res | jq -r '.id')

# 모든 사용자 조회
res=$(GET /users)

# 특정 ID를 가진 사용자 조회
res=$(GET /users/$id)

# 특정 ID를 가진 사용자 업데이트
res=$(
    PATCH /users/$id \
        -H "Content-Type: application/json" \
        -d '{
                "username": "updatedUser",
                "firstName": "Updated",
                "lastName": "User",
                "birthdate": "2000-01-01T00:00:00.000Z"
            }'
)
# 특정 ID를 가진 사용자 삭제
res=$(DELETE /users/$id)

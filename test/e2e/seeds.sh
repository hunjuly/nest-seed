#!/bin/bash
cd "$(dirname "$0")"
. ./common.cfg

# 새로운 seed 생성
res=$(
    POST "/seeds?abd=0&ddf" \
        -H "Content-Type: application/json" \
        -d '{
                "name": "testSeed",
                "desc": "This is a test seed",
                "date": "2023-06-16T15:12:00.000Z",
                "enums": ["EnumA", "EnumB"],
                "integer": 5
            }'
)
id=$(echo $res | jq -r '.id')

# 모든 seeds 조회
res=$(GET /seeds)

# 특정 ID를 가진 seed 조회
res=$(GET /seeds/$id)

# 특정 ID를 가진 seed 업데이트
res=$(
    PATCH /seeds/$id \
        -H "Content-Type: application/json" \
        -d '{
                "name": "updatedSeed",
                "desc": "This is an updated test seed",
                "date": "2023-06-16T15:12:00.000Z",
                "enums": ["EnumA", "EnumC"],
                "integer": 10
            }'
)

# 특정 ID를 가진 seed 삭제
res=$(DELETE /seeds/$id)

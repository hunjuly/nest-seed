#!/bin/bash
set -e
cd "$(dirname "$0")"

clear

ERROR_LOG=""

. ./auth.sh
. ./users.sh

# ERROR_LOG가 비어있는지 확인
if [[ -z "$ERROR_LOG" ]]; then
    echo "Test Successful!"
else
    echo "Test Failed!"
    echo -e "$ERROR_LOG"
    exit 1
fi

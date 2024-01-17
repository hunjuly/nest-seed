#!/bin/bash
set -ex
. "$(dirname "$0")"/common.cfg

echo "1"
# clear
echo "2"

ERROR_LOG=""

echo "3"

. $SCRIPTS_PATH/auth.test
echo "4"

. $SCRIPTS_PATH/users.test

if [[ -z "$ERROR_LOG" ]]; then
    echo "Test Successful"
else
    echo "List of Failed Tests:"
    echo -e "$ERROR_LOG"
    exit 1
fi

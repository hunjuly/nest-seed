#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

clear

ERROR_LOG=""

. $SCRIPTS_PATH/auth.sh
. $SCRIPTS_PATH/users.sh

if [[ -z "$ERROR_LOG" ]]; then
    echo "Test Successful"
else
    echo "List of Failed Tests:"
    echo -e "$ERROR_LOG"
    exit 1
fi

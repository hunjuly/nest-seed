#!/bin/bash
set -e
cd "$(dirname "$0")"

clear

ERROR_LOG=""

. ./auth.sh
. ./users.sh

if [[ -z "$ERROR_LOG" ]]; then
    echo "Test Successful"
else
    echo "List of Failed Tests:"
    echo -e "$ERROR_LOG"
    exit 1
fi

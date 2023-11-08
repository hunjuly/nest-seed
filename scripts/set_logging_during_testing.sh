#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

if [ $1 == 'enable' ]; then
    mkdir -p $WORKSPACE_ROOT/config
    touch $WORKSPACE_ROOT/config/@DEV_LOGGING_DURING_TESTING
else
    rm -f config/@DEV_LOGGING_DURING_TESTING
fi

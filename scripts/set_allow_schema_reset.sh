#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

mkdir -p $WORKSPACE_ROOT/config
touch $WORKSPACE_ROOT/config/@DEV_ALLOW_SCHEMA_RESET

#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

bash $SCRIPTS_PATH/run_infra.sh

mkdir -p $WORKSPACE_ROOT/logs
npm install --prefix $WORKSPACE_ROOT

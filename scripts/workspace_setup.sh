#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

bash $SCRIPTS_PATH/run_infra.sh

mkdir -p $WORKSPACE_ROOT/logs
mkdir -p $WORKSPACE_ROOT/uploads
npm ci --prefix $WORKSPACE_ROOT

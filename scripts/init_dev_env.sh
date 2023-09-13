#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

bash $SCRIPTS_PATH/infra_up.sh
bash $SCRIPTS_PATH/set_allow_schema_reset.sh

mkdir -p $WORKSPACE_ROOT/logs
npm install --prefix $WORKSPACE_ROOT

#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

bash $SCRIPTS_PATH/run_infra.sh

mkdir -p $WORKSPACE_ROOT/$LOG_DIRECTORY
mkdir -p $WORKSPACE_ROOT/$FILE_UPLOAD_DIRECTORY

npm ci --prefix $WORKSPACE_ROOT

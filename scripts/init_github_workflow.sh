#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

GITHUB_WORKSPACE
bash $SCRIPTS_PATH/init_database.sh
bash $SCRIPTS_PATH/set_allow_schema_reset.sh

cd ..

mkdir -p logs
npm install

#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg
. $ENV_FILE

export TYPEORM_HOST=$TYPEORM_HOST
export TYPEORM_PORT=$TYPEORM_PORT
export TYPEORM_USERNAME=$TYPEORM_USERNAME
export TYPEORM_PASSWORD=$TYPEORM_PASSWORD
export TYPEORM_DATABASE=$TYPEORM_DATABASE
export TYPEORM_SCHEMA=$TYPEORM_SCHEMA
export TYPEORM_POOL_SIZE=$TYPEORM_POOL_SIZE

npm run build
npm run migration:run --prefix $WORKSPACE_ROOT

#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..

bash scripts/infra_up.sh
bash scripts/set_allow_schema_reset.sh

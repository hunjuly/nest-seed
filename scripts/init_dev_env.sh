#!/bin/bash
set -e
cd "$(dirname "$0")"

bash infra_up.sh

bash set_allow_schema_reset.sh

cd ..

mkdir -p logs
npm install

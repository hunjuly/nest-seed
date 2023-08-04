#!/bin/bash
set -e
cd "$(dirname "$0")"
cd ..

mkdir -p config
touch config/@DEV_ALLOW_SCHEMA_RESET

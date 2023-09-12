#!/bin/bash
set -e
cd "$(dirname "$0")"

cd ..
mkdir -p config
touch config/@DEV_LOGGING_DURING_TESTING

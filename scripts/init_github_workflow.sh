#!/bin/bash
set -e
. "$(dirname "$0")"/common.cfg

bash $SCRIPTS_PATH/init_database.sh
bash $SCRIPTS_PATH/set_allow_schema_reset.sh

cd ..

mkdir -p logs
npm install


--workdir /__w/nest-seed/nest-seed --network github_network_23c1ca40c98045209ecce3b246682720
-e "HOME=/github/home"
-e GITHUB_ACTIONS=true -e CI=true
-v "/var/run/docker.sock":"/var/run/docker.sock"
-v "/home/runner/work":"/__w"
-v "/home/runner/runners/2.308.0/externals":"/__e":ro
-v "/home/runner/work/_temp":"/__w/_temp"
-v "/home/runner/work/_actions":"/__w/_actions"
-v "/opt/hostedtoolcache":"/__t"
-v "/home/runner/work/_temp/_github_home":"/github/home"
-v "/home/runner/work/_temp/_github_workflow":"/github/workflow"
--entrypoint "tail" node:lts-alpine "-f" "/dev/null"

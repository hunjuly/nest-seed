- name: Create logs folder
run: mkdir -p ./logs

- name: set allow schema reset
run: bash scripts/set_allow_schema_reset.sh

- name: Init DB
run: bash scripts/init_database.sh

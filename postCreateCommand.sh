mkdir -p logs

touch @DEV_ALLOW_SCHEMA_RESET
touch @DEV_ENABLE_TEST_LOGGING

npm install
npm run infra:up

mkdir -p logs

touch @DEV_TYPEORM_AUTO_RESET
touch @DEV_TEST_LOG

npm install
npm run infra:up

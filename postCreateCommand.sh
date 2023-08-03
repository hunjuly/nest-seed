npm i --prefix ./

mkdir -p logs
touch @DEV_TYPEORM_AUTO_RESET
touch @DEV_TEST_LOG

npm run infra:up

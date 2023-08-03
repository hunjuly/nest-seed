# 통신사가 KT면 `npm i -D ts-jest`가 안 되는 문제가 있다.
# 당분간 mirror를 사용한다.
npm install --registry https://registry.npmjs.cf/ express
npm config set registry https://registry.npmjs.cf/

npm i --prefix ./
git config --global pull.rebase true
git config --global user.name "hunjuly"
git config --global user.email "hunjuly@gmail.com"

mkdir -p logs
touch @DEV_TYPEORM_AUTO_RESET
touch @DEV_TEST_LOG

bash scripts/dev.sh infra_up

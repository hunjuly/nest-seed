## Description

이 문서는 nestjs, redis, grpc, 그리고 typeorm을 사용한 프로그래밍에 대해 설명합니다.

## Prerequisites

프로젝트를 실행하기 전에 Node.js가 설치되어 있어야 합니다. 이 프로젝트는 최신 LTS 버전의 Node.js를 사용하므로, 최신 LTS 버전을 설치하는 것이 좋습니다.

### Sharing Git credentials with your container

https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials

컨테이너 생성 시 아래의 명령어를 반복하지 않으려면 위의 링크를 참조

```
git config --global pull.rebase true
git config --global user.name "yourName"
git config --global user.email "your@email.com"
```

## Installation

```bash
$ npm install
```

NPM 패키지를 설치합니다. 설치가 완료되면, 프로젝트를 실행하거나 빌드할 준비가 됩니다.

## Running Development Environment

`.devcontainer/devcontainer.json`이 성공적으로 실행되면 개발환경 설정이 완료된다.

개발환경을 다시 설정해야 한다면 `Rebuild Container`를 실행을 권장함. 그러나 수동으로 설정하려면 `bash scripts/init_dev_env.sh`을 실행한다.

그 외 기본적으로 사용하는 명령들이다.

```bash
npm start
npm test
```

위의 스크립트를 실행하면 개발 환경이 시작됩니다. NestJS 애플리케이션을 디버그 모드로 시작하며, 파일 변경을 감지하여 자동으로 재시작합니다.

### Development with Typeorm

synchonize를 true로 하고 배포하면 치명적인 손상이 발생할 수 있다.
가능성을 차단하기 위해서 개발 환경에서도 synchronize를 사용하지 않는다.

그러나, 꼭 synchronize를 사용해야 하는 경우에는 `bash scripts/set_allow_schema_reset.sh`을 실행해서 `config/@DEV_ALLOW_SCHEMA_RESET` 파일을 생성하면 테스트 로그를 출력할 수 있습니다.

### Testing with Jest

테스트는 Jest를 사용하여 실행됩니다. 테스트 실행 중에 파일이 변경되면 Jest는 변경된 파일에 대한 테스트만 재실행합니다. 테스트 커버리지 보고서를 생성하려면 npm run test:all을 실행하세요.

`bash scripts/set_logging_during_testing.sh`을 실행해서 `config/@DEV_LOGGING_DURING_TESTING` 파일을 생성하면 테스트 로그를 출력할 수 있습니다.

jest를 실행했을 때 아래처럼 에러가 발생하면 아래의 스크립트를 실행한다.

참고 https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc

```sh
# Error: ENOSPC: System limit for number of file watchers reached, watch '/workspaces/nestjs-ex/src'

echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

## Debugging

`npm start`를 실행하여 프로세스에 연결할 수 있습니다.

vscode에 Jest Runner 및 code lens 확장 프로그램이 설치되어 있는 경우, unit tests에 대한 Run|Debug 메뉴가 표시됩니다.

## Migration

1. npm run typeorm:generate
1. 생성된 src/database/migrations/\*-nestex.ts 파일을 src/database/data-source.ts에 추가
1. npm run typeorm:migration
1. npm run typeorm:show로 적용된 것을 확인한다.

## Production Deployment

Production 환경에 배포하기 위한 단계는 다음과 같습니다.

```bash
# test
$ npm test:all

# build
$ npm run build

# run
$ npm run start:prod
```

## 디자인 가이드

[해당 문서](./docs/guides/design.guide.md)

###

UsersModule과 AuthModule로 분리되어 있었다. 그러나 만약 User의 종류가 둘이 된다면 Auth의 종류도 그에 맞게 생겨야 한다. 그리고 AuthModule로 분리해서 생기는 장점이 크지 않다.

###

LogicException은 가능한 Assert.\*으로 처리하고 테스트를 만들지 않는다.

서비스 간 트랜잭션 핸들을 공유하지 않는다. 전통적인 트랜잭션 구조는 포기한다. 각 서비스가 MSA의 일부라는 가정 하에 개발한다.

## 테스트 작성 지침

e2e에 대한 일반론은 아래와 같다.

End-to-end 테스트는 전체 시스템이 아닌 특정한 기능이나 모듈의 동작을 테스트하는 단위 테스트와는 다르게, 시스템의 다양한 부분을 통합해서 테스트를 수행하게 됩니다. 따라서, End-to-end 테스트는 서비스를 빌드하고 배포하기 전에 수행하는 것이 좋습니다. 보통, End-to-end 테스트는 최종 사용자가 시스템을 사용하는 시나리오를 테스트하며, 이를 수행하기 위해 실제 서비스와 동일한 환경을 구성하여 수행합니다. 이러한 이유로 End-to-end 테스트는 보통 운영환경과 유사한 별도의 테스트 서버나 스테이징 서버에서 수행합니다. 또한, End-to-end 테스트는 시스템 전체를 대상으로 수행하기 때문에 수행 시간이 오래 걸리는 경우가 많습니다. 이러한 이유로 End-to-end 테스트는 빌드 파이프라인에서 자동화하여 수행하는 것이 좋습니다.

그러나, 유닛 테스트를 클래스 마다 작성하는 것은 비용이 크다.

e2e에 가까운 모듈 테스트를 작성해서 모듈 단위로 테스트를 작성하는 게 효율적이다.
만약, 한 모듈을 여러 팀이 나눠 개발한다면 각 팀의 경계를 mock으로 만들어서 테스트 해야 한다. 이런 경우에는 단위 테스트에 가깝게 될 수 있다.

테스트 코드는 반드시 완전한 e2e-test나 unit-test로 작성할 필요는 없다. 상황에 따라 어느 정도 균형을 맞춰야 한다.


### stress test

스트레스 테스트는 jmeter로 작성했다.

1. ./test/stress/HTTPRequest.jmx에서 주소를 변경한다.

```xml
<stringProp name="HTTPSampler.domain">vscode-nestjs-seed</stringProp>
```
1. ./test/stress/run.sh 실행

## 주의사항

-   axios는 테스트 용도다. 그래서 dependencies가 아니라 devDependencies에 있다.

```json
"devDependencies": {
    ...
    "axios": "^1.4.0",
    ...
}
```

-   typeorm의 poolSize는 3이상이어야 한다. 3 미만이면 테스트가 실패한다. 기본값이 10이어도 상황에 따라서 종종 테스트가 실패한다.
-   typeorm이 종종 5초 이상 걸리는 경우가 있다. 이런 경우에는 테스트가 실패할 수 있다. 그래서 기본값을 10분으로 설정했다.
-   테스트 도중 아래와 같은 메시지가 나오면 무시해도 된다. 모듈 종료 후에 트랜잭션이 종료되지 않아서 발생하는 메시지다.
    `[winston] Attempt to write logs with no transports, which can increase memory usage: {"level":"warn","message":"QueryRunner is already released"}`

## 용어

-   상영 중, screening\
    영화를 개봉해서 상영 종료 전까지를 뜻한다.
-   상영 예정, upcoming\
    아직 개봉하지 않았다.
-   현재 시간 이후의 모든 상영 시간, future showtimes\
    screening + upcoming
-   재생 중, playing\
    영화가 지금 극장에서 재생 중
-   상영 종료, screening ended\
    더 이상 상영하는 극장이 없음.

## VSCODE에서 PlantUML 사용하기

-   md 파일에 포함된 UML 다이어그램을 미리보기하려면 @startuml과 @enduml 사이의 커서를 위치시키면 됩니다. 한 번 미리보기를 설정하면 다른 다이어그램을 선택할 때까지 유지됩니다.
-   markdown에서 미리보기가 안 된다면 secure 설정이 필요하다. 외부 http 컨텐츠가 disable 되어있는 상태다. 프리뷰 화면 오른쪽 상단 `...` 눌러서 change preview security setting을 설정해라.

## License

이 프로젝트는 MIT 라이센스를 따릅니다. 라이센스에 대한 자세한 내용은 LICENSE 파일을 참조하세요.

# NEST-SEED

NestJS를 사용한 프로젝트 개발을 위한 시작점으로, 필수 기능 및 구성을 포함한 template입니다. 이 문서는 프로젝트 설정, 실행 및 관리에 필요한 상세 지침을 제공합니다.

## Project Setup Guide

프로젝트를 시작하기 위해 아래 설정 사항들을 검토하고 필요에 따라 변경하세요.

-   .env.development
    -   REDIS_HOST
    -   POSTGRES_DB_HOST
    -   MONGO_DB_HOST
-   devcontainer.json
    -   forwardPorts
-   package.json
    -   name

## Requirements

이 프로젝트를 실행하기 위해서 아래의 필수 구성요소가 Host에 설치되어야 한다.

-   docker
-   vscode & extensions
    -   Dev Containers(ms-vscode-remote.remote-containers)

> 윈도우 환경은 지원하지 않는다. 윈도우 사용자는 VMWare와 Ubuntu에서 vscode를 실행해라.

가능하면 `Remote - SSH(ms-vscode-remote.remote-ssh)` extension을 구성하고 사용하는 것을 추천한다.

## Configuring the Development Environment

-   `메뉴/View/Command Palette...`에서 `Dev Containers: Rebuild Container`를 실행하면 개발 환경이 자동으로 설정된다.
-   `Rebuild Container`를 실행한 후에 아래의 명령을 반복하지 않으려면 Host에서 [git credentials](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials)을 설정해야 한다.
    ```
    git config --global pull.rebase true
    git config --global user.name "yourName"
    git config --global user.email "your@email.com"
    ```
-   Host가 linux인 경우, jest를 실행했을 때 `System limit for number of file watchers reached` 에러가 발생하면 Host에서 아래의 스크립트를 실행한다([참고](https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc)).

    ```sh
    # Error: ENOSPC: System limit for number of file watchers reached, watch '/workspaces/nest-seed/src'

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
    ```

## Running the Development Environment

-   `메뉴/Terminal/Run Task...`을 실행하면 개발 중에 필요한 task를 실행할 수 있다.
-   소스 수정 시 기본적으로 `Watch Start`과 `Watch Test`를 실행해야 한다.
    -   `Watch Start`: Nest 애플리케이션을 디버그 모드로 시작하며, 파일 변경을 감지하여 자동으로 재시작한다.
    -   `Watch Test`: 테스트 코드를 실행하며, 파일 변경을 감지하여 자동으로 다시 테스트한다.
-   유닛 테스트를 실행해야 하는 환경에서는 테스트 마다 DB를 초기화 하기 위해서 `NODE_ENV=development`와 typeorm의 `synchronize`를 허용해야 한다.

## Debugging

-   `Watch Start`을 디버깅 하려면 `Run and Debug/Attach to Start`을 실행한다.
-   `Watch Test`을 디버깅 하려면 `Run and Debug/Attach to Test`를 실행한다.
-   vscode에 `Jest Runner` 및 `code lens` extension이 설치되어 있는 경우, Jest의 test에 `Run | Debug` 메뉴가 표시된다. 여기서 `Debug`를 클릭하면 해당 테스트에 대해서 자동으로 디버거를 연결하고 실행한다.

## Testing

-   `stress-test`는 `Jmeter`로 작성했다. `/test/stress/run.sh` 실행
    -   user를 생성/조회하는 간단한 테스트다. 실제 프로젝트에서는 `Jmeter` 스크립트를 다시 작성해야 한다.
-   `e2e-test`는 `bash script`로 작성했다. `/test/e2e/run.sh` 실행
-   `unit-test`는 `Jest`로 작성했다.
    -   typeorm의 poolSize는 3이상이어야 한다. 3 미만이면 테스트가 실패한다. 기본값이 10이어도 상황에 따라서 종종 테스트가 실패한다.
    -   typeorm의 응답이 종종 5sec를 초과하는 경우가 있다. 그래서 기본값을 60sec으로 설정했다.
    -   테스트 도중 아래와 같은 메시지가 나오면 무시해도 된다. 모듈 종료 후에 트랜잭션이 종료되지 않아서 발생하는 메시지다.
        ```
        [winston] Attempt to write logs with no transports, which can increase memory usage: {"level":"warn","message":"QueryRunner is already released"}
        ```

## Database Migration

1. 생성
    1. `Run Task.../Generate Migration`을 실행하면 migration 파일이 생성된다.
    1. 생성된 `src/database/typeorm/migrations/\*.ts` 파일을 `src/database/typeorm/typeorm.config.ts`의 `migrations[]`에 추가
1. 적용
    1. `npm run migration:run`을 실행한다.
    1. `npm run migration:show`로 적용된 것을 확인한다.

## Production Deployment

Production 환경에 배포하기 위한 기본적인 단계는 다음과 같다.

```bash
# test
$ npm test:all

# build
$ npm run build

# run
$ npm run start:prod
```

## PlantUML in VSCode

-   md 파일에 포함된 UML다이어그램을 `PlantUML Preview`로 보려면 `@startuml`과 `@enduml` 사이에 커서가 위치해야 한다.
-   `Preview markdown`에서 UML다이어그램이 나오지 않는다면 secure 설정이 필요하다. `Preview` 화면 오른쪽 상단에 `...`을 눌러서 `change preview security setting`을 설정해라.

## Guides

그 외에 README에서 다루지 못한 중요 정보들이다.

-   [Design Guide](./docs/guides/design.guide.md)
-   [Problems with Feature Modules](./docs/guides/problems-with-feature-modules.md)
-   [Implementation Guide](./docs/guides/implementation.guide.md)

## Known Issues

-   linux on VMWare에서 docker container의 network를 bridge로 실행하는 환경에서 linux 외부 네트워크(인터넷)에 연결하지 못하는 문제가 종종 발생한다. linux를 다시 실행하면 해결이 되는데 원인을 모른다.

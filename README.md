# NEST-SEED

nest 프로젝트를 시작할 때 필요한 기본적인 기능을 구현한 template이다.

## 용어

-   Host: Docker를 실행하는 운영체제로, 보통 사용자의 PC/laptop의 macOS 혹은 Linux가 이 역할을 합니다. Host OS 위에서 여러 개의 컨테이너를 실행할 수 있습니다.
-   Container: Docker에서 실행 중인 격리된 환경으로, 여기서는 alpine-linux를 기반으로 합니다. 컨테이너는 호스트 OS의 커널과 필수 리소스를 공유하며, 어플리케이션과 그 의존성을 포함하고 독립적으로 작동합니다.

## Prerequisites

이 프로젝트를 실행하기 위해서 아래의 필수 구성요소가 Host에 설치되어야 한다.

-   docker
-   vscode & extensions
    -   Dev Containers(ms-vscode-remote.remote-containers)

> 윈도우 환경은 지원하지 않는다. 윈도우 사용자는 VMWare와 Ubuntu에서 vscode를 실행해라.

가능하면 `Remote - SSH(ms-vscode-remote.remote-ssh)` extension을 구성하고 사용하는 것을 추천한다.

## Setup Development Environment

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

## Running Development Environment

-   `메뉴/Terminal/Run Task...`을 실행하면 개발 중에 필요한 task를 실행할 수 있다.
-   소스 수정 시 기본적으로 `Watch Start`과 `Watch Test`를 실행해야 한다.
    -   `Watch Start`: Nest 애플리케이션을 디버그 모드로 시작하며, 파일 변경을 감지하여 자동으로 재시작한다.
    -   `Watch Test`: 테스트 코드를 실행하며, 파일 변경을 감지하여 자동으로 다시 테스트한다.
-   NODE_ENV=development라면 typeorm의 synchronize를 사용한다. 비활성화 시키려면 `config/@DEV_ALLOW_SCHEMA_RESET` 파일을 삭제한다

## Debugging

-   `Watch Start`을 디버깅 하려면 `Run and Debug/Attach to Start`을 실행한다.
-   `Watch Test`을 디버깅 하려면 `Run and Debug/Attach to Test`를 실행한다.
-   vscode에 `Jest Runner` 및 `code lens` extension이 설치되어 있는 경우, Jest의 test에 `Run | Debug` 메뉴가 표시된다. 여기서 `Debug`를 클릭하면 해당 테스트에 대해서 자동으로 디버거를 연결하고 실행한다.

## Database Migration

1. 생성
    1. `Run Task.../Generate Migration`을 실행하면 migration 파일이 생성된다.
    1. 생성된 `src/database/migrations/\*.ts` 파일을 `src/database/typeorm.config.ts`의 `migrations[]`에 추가
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

## Test

-   `stress-test`는 `Jmeter`로 작성했다. `/test/stress/run.sh` 실행
    -   user를 생성/조회하는 간단한 테스트다. 실제 프로젝트에서는 `Jmeter` 스크립트를 다시 작성해야 한다.
-   `e2e-test`는 `bash script`로 작성했다. `/test/e2e/test_all.sh` 실행
-   `unit-test`는 `Jest`로 작성했다.
    -   typeorm의 poolSize는 3이상이어야 한다. 3 미만이면 테스트가 실패한다. 기본값이 10이어도 상황에 따라서 종종 테스트가 실패한다.
    -   typeorm의 응답이 종종 5sec를 초과하는 경우가 있다. 그래서 기본값을 60sec으로 설정했다.
    -   테스트 도중 아래와 같은 메시지가 나오면 무시해도 된다. 모듈 종료 후에 트랜잭션이 종료되지 않아서 발생하는 메시지다.
        ```
        [winston] Attempt to write logs with no transports, which can increase memory usage: {"level":"warn","message":"QueryRunner is already released"}
        ```

## VSCODE에서 PlantUML 사용하기

-   md 파일에 포함된 UML다이어그램을 `PlantUML Preview`로 보려면 `@startuml`과 `@enduml` 사이에 커서가 위치해야 한다.
-   `Preview markdown`에서 UML다이어그램이 나오지 않는다면 secure 설정이 필요하다. `Preview` 화면 오른쪽 상단에 `...`을 눌러서 `change preview security setting`을 설정해라.

## 참고 자료

그 외에 README에서 다루지 못한 중요 정보들이다.

-   [Design Guide](./docs/design.guide.md)
-   [Implementation Guide](./docs/implementation.guide.md)
-   [Naming Rules](./docs/naming-rules.md)
-   [Troubleshooting](./docs/troubleshooting.md)

## Files & Folders

```bash
.
├── .devcontainer
│   ├── devcontainer.json # 개발 환경 설정은 가능한 여기서 한다
│   └── Dockerfile # development용 Dockerfile.
│                  # 버전이 lts로 설정되어 있는데 실제 프로젝트에서는 구체적인 버전을 명시해야 한다.
├── .vscode
│   ├── launch.json # debugger process attach 설정
│   └── tasks.json  # 개발 중에 사용하는 task 정의
├── docs
├── scripts # 개발에 필요한 스크립트
│   ├── clean_up.sh # git에 commit되지 않는 모든 파일을 삭제한다
│   ├── infra_up.sh # DB나 redis 등 테스트 infra를 생성한다
│   ├── init_dev_env.sh # 개발 환경 초기화. infra up/typeorm syncronize를 설정한다
│   ├── launch_psql.sh  # infra_up.sh로 생성한 Postgresql에 접속한다.
│   ├── run_container.sh    # e2e, stress 테스트를 위해서 소스를 빌드하고 container로 실행한다
│   ├── set_allow_schema_reset.sh   # TypeORM의 syncronize 기능 활성화
│   ├── set_logging_during_testing.sh   # Jest 실행 중 log 기능 활성화
│   ├── start_postgresql.sh # 테스트 infra인 Postgresql 생성 및 설정
│   └── start_redis.sh  # 테스트 infra인 Redis 생성 및 설정
├── src
│   ├── __tests__   # 시나리오 테스트를 포함해서 여러 service에 걸쳐서 실행되는 테스트다
│   ├── common  # 여러 프로젝트에서 공통적으로 사용되는 기능 모음
│   ├── controllers  # REST API 컨트롤러. 각 모듈에 분산되어 있는 컨트롤러를 별도의 폴더(레이어)로 분리했다.
│   │   ├── authentication  # Controller에서 실행하는 인증 관련 기능들
│   │   ├── modules   # Controller에서 사용하는 공통 모듈들
│   │   └── seeds.controller.ts   # 새 Controller를 생성할 때 template이 되는 코드
│   ├── database    # Typeorm과 관련된 기능 모음
│   ├── global  # DB, Logger, Config 등 전체 Service에서 사용하는 모듈들
│   ├── services  # DB, Logger, Config 등 전체 Service에서 사용하는 모듈들
│   │   ├── _seeds  # 새 Service를 생성할 때 template이 되는 코드
│   │   └── users   # User 서비스
│   └── main.ts # 소스코드 진입점
├── test
│   ├── e2e # e2e 테스트. 복잡한 테스트는 Jest를 사용하고 여기서는 REST API를 한 번씩 호출하는 정도로 한다.
│   └── stress  # Jmeter로 작성한 간단한 stress test
├── Dockerfile  # production용 Dockerfile
└── package.json    # 프로젝트의 기본 정보
```

## 문제들

-   linux on VMWare에서 docker container의 network를 bridge로 실행하는 환경에서 linux 외부 네트워크(인터넷)에 연결하지 못하는 문제가 종종 발생한다. linux를 다시 실행하면 해결이 되는데 원인을 모른다.

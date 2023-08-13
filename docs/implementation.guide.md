# Implementation Guide

## 3. Controller Layer Design

일반적인 Controller의 코드다. getUser()를 보면 두 가지 특징이 있다.

-   사용자가 존재하지 않으면 예외를 던진다.
-   Entity를 Dto로 변환한다

```ts
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get(':userId')
    async getUser(@Param('userId') userId: string) {
        const userExists = await this.usersService.userExists(userId)

        // userId가 존재하지 않으면 NOT_FOUND(404) 반환한다
        if (!userExists) {
            throw new NotFoundException(`User with ID ${userId} not found`)
        }

        const user = await this.usersService.getUser(userId)

        // User entity를 UserDto로 변환해서 반환한다
        return new UserDto(user)
    }
}
```

### 3.1. Controller에서 Entity를 DTO로 변환하는 이유

1. REST API나 GRPC에서 요구하는 데이터 형식이 다를 수 있다.
1. 서비스에서 변환하면 서비스가 컨트롤러에 종속되는 문제가 발생한다.
1. 서비스에서 변환하면 다른 서비스가 사용할 때 DTO를 받게된다. 그러나 DTO는 컨트롤러에서만 사용해야 한다. 컨트롤러에서 예외를 던지는 이유 컨트롤러는 단순히 데이터 변환과 송수신을 담당한다.
1. 그러나 Http냐 RPC냐에 따라서 던져야 하는 예외가 달라진다.
1. 서비스는 다른 서비스를 사용한다. 컨트롤러도 서비스를 사용하는 것이다. 서비스를 사용하는 주체의 동작은 동일해야 한다. 다른 서비스에서도 예상 가능한 예외는 사전에 점검하기 때문에 컨트롤러도 동일한 구조를 가지는 것이 좋다.

### 3.2. 컨트롤러에서 예외를 던지는 이유

컨트롤러는 단순히 데이터 변환과 송수신을 담당한다. 그러나 Http냐 RPC냐에 따라서 던져야 하는 예외가 달라진다. 서비스는 다른 서비스를 사용한다. 컨트롤러도 서비스를 사용하는 것이다.
서비스를 사용하는 주체의 동작은 동일해야 한다.
다른 서비스에서도 예상 가능한 예외는 사전에 점검하기 때문에 컨트롤러도 동일한 구조를 가지는 것이 좋다.


## 4. Domain 레이어

### 4.1. 엔티티 Id type

uuid는 고유 식별자를 생성하는 방법 중 하나이며, 자동으로 문자열 형태의 값을 생성합니다. uuid를 사용하는 것이 데이터베이스의 성능과 관련이 있다면, uuid를 사용하는 대신 auto-increment 되는 정수형 ID를 사용하는 것이 더 좋을 수 있습니다. 그러나 성능의 문제가 없다면 uuid를 사용하는 것이 데이터베이스에 더 많은 유연성을 제공할 수 있습니다.

### typeorm과 도메인의 엔티티 관계

Q : typeorm의 코드는 infrastructure 레이어에 포함되는거 아니야? DDD에서는 도메인 레이어와 infrastructure 레이어를 구분하게 되어있는데 entities가 왜 domain 폴더의 하위에 있지?

A: 일반적으로, DDD에서 도메인 레이어는 도메인의 핵심 비즈니스 로직과 개념을 포함하고,
인프라스트럭처 레이어는 도메인의 구현을 위한 기술적 세부 사항을 다룹니다.\
TypeORM과 같은 ORM 프레임워크를 사용할 때, entity는 도메인 객체의 구현에 필요한 기술적 세부 사항을 포함합니다. 그러나 entity는 여전히 도메인 모델의 일부이므로 도메인 레이어에서 구현되어야합니다.\
즉, entities가 domain 폴더의 하위 폴더에 위치하는 것은 일반적인 구조입니다. 이러한 구조를 사용하면 도메인과 구현 사이의 경계를 유지하면서 도메인 모델과 데이터베이스 스키마 간의 매핑을 쉽게 할 수 있습니다.\
마찬가지로, 서비스는 도메인 객체를 조작하고 도메인 로직을 캡슐화하기 때문에 도메인 레이어에 위치하는 것이 일반적입니다. 이렇게 하면 서비스가 도메인 객체와 도메인 로직을 더 잘 캡슐화 할 수 있으며, 비즈니스 규칙의 변화에 대응하기 쉽습니다.

요약하면, 도메인 객체에 TypeORM 코드가 추가된 것이다. TypeORM이 도메인 엔티티에 의존하는 것이지 엔티티가 TypeORM에 의존하는 것이 아니다.

## 5. Module Design Guide

### index.ts는 순환참조를 주의해야 한다

users/index.ts에 아래처럼 했었다. 그러나 이것은 순환참조 문제를 일으킨다.
auth/service.ts에서 import _ from 'users'를 해서 User 엔티티를 참조한다.
User는 import _ from 'auth'를 해서 Auth 엔티티의 무언가를 참조한다.
이런 식으로 참조에 참조를 하게 된다.

```ts
export * from './dto'
export * from './entities'
export * from './users.module'
export * from './users.service'
```

그래서 적어도 모듈 단위의 index.ts는 정의하지 않기로 한다.

###

UsersModule과 AuthModule로 분리되어 있었다. 그러나 만약 User의 종류가 둘이 된다면 Auth의 종류도 그에 맞게 생겨야 한다. 그리고 AuthModule로 분리해서 생기는 장점이 크지 않다.

## 그 외 Design Guide

### 예외/검증

아래와 같이 expect 혹은 assert 구문을 사용했었다.\
그러나 이렇게 하면 vscode에서 showtime이 undefined가 아니라고 단정할 수 없어서 에러가 발생한다.

```js
Expect.found(showtime, `Showtime(${showtimeId}) not found`)
```

아래처럼 프로그래머의 실수로 예상되는 LogicException은 테스트를 작성하지 않는다.
그 외에도 throw Exception의 테스트는 중요 예외 처리가 아니면 작성하지 않는다. 유지비용이 크다.

```js
/* istanbul ignore if */
if (availableTicketCount === undefined) {
    throw new LogicException(`Available ticket count for showtime ${showtime.id} not found`)
}
```

###

LogicException은 가능한 Assert.\*으로 처리하고 테스트를 만들지 않는다.

서비스 간 트랜잭션 핸들을 공유하지 않는다. 전통적인 트랜잭션 구조는 포기한다. 각 서비스가 MSA의 일부라는 가정 하에 개발한다.

## Test Design Guide

e2e에 대한 일반론은 아래와 같다.

End-to-end 테스트는 전체 시스템이 아닌 특정한 기능이나 모듈의 동작을 테스트하는 단위 테스트와는 다르게, 시스템의 다양한 부분을 통합해서 테스트를 수행하게 됩니다. 따라서, End-to-end 테스트는 서비스를 빌드하고 배포하기 전에 수행하는 것이 좋습니다. 보통, End-to-end 테스트는 최종 사용자가 시스템을 사용하는 시나리오를 테스트하며, 이를 수행하기 위해 실제 서비스와 동일한 환경을 구성하여 수행합니다. 이러한 이유로 End-to-end 테스트는 보통 운영환경과 유사한 별도의 테스트 서버나 스테이징 서버에서 수행합니다. 또한, End-to-end 테스트는 시스템 전체를 대상으로 수행하기 때문에 수행 시간이 오래 걸리는 경우가 많습니다. 이러한 이유로 End-to-end 테스트는 빌드 파이프라인에서 자동화하여 수행하는 것이 좋습니다.

그러나, 유닛 테스트를 클래스 마다 작성하는 것은 비용이 크다.

e2e에 가까운 모듈 테스트를 작성해서 모듈 단위로 테스트를 작성하는 게 효율적이다.
만약, 한 모듈을 여러 팀이 나눠 개발한다면 각 팀의 경계를 mock으로 만들어서 테스트 해야 한다. 이런 경우에는 단위 테스트에 가깝게 될 수 있다.

테스트 코드는 반드시 완전한 e2e-test나 unit-test로 작성할 필요는 없다. 상황에 따라 어느 정도 균형을 맞춰야 한다.

### Transaction

아래와 같이 Scope.REQUEST 로 설정된 TransactionService를 사용하면 scope bubble up 이 발생하여 성능이 하락하고 테스트가 어려워진다.
필요한 곳에서 transaction을 시작하고 끝내는 것이 좋다.

```ts
@Injectable({ scope: Scope.REQUEST })
export class TransactionService implements OnModuleDestroy {
    private queryRunner?: QueryRunner

    constructor(private dataSource: DataSource) {}

    async onModuleDestroy() {
        if (this.queryRunner && !this.queryRunner.isReleased) {
            await this.rollbackAndRelease()
        }
    }

    async startTransaction(): Promise<void> {
        if (!this.queryRunner) {
            this.queryRunner = this.dataSource.createQueryRunner()
            await this.queryRunner.connect()
        }

        try {
            await this.queryRunner.startTransaction()
        } catch (error) {
            throw new SystemException(`Failed to start a new transaction(${error})`)
        }
    }

    ...
}
```

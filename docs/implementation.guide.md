# Implementation Guide

코드를 작성할 때 고민하게 되는 물리적인 규칙을 설명한다.

## 1. Controller 레이어

다음은 일반적인 Controller의 코드다.

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

getUser()는 두 가지 특징이 있다.

-   사용자가 존재하지 않으면 예외를 던진다.
-   User entity를 UserDto로 변환한다

### 1.1. Controller에서 예외를 던지는 이유

1. REST API나 GRPC 등 통신방식에 따라서 던져야 하는 예외가 다르다.
1. Controller에 예외가 발생할 수 있는 조건을 점검하면 문서화가 쉽다.

### 1.2. Controller에서 entity를 DTO로 변환하는 이유

1. REST API나 GRPC 등 통신방식에 따라서 요구하는 데이터 형식이 다를 수 있다.
1. 서비스에서 변환하면 서비스가 컨트롤러에 종속된다. 이것은 Layered Architecture 개념과 상충된다.
1. 서비스 간에 반환값이 DTO가 되면 안 된다. DTO는 컨트롤러에서만 사용한다.

## 2. Domain 레이어

### 2.1. AggregateRoot와 Entity의 Identifier

DDD(Domain Driven Design)에서 제안하는 AggregateRoot와 Entity 개념을 다음과 같이 구현했다.

```ts
export abstract class AggregateRoot {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn()
    version: number
}

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number
}
```

`AggregateRoot`의 id는 UUID type으로 한다. Entity는 Aggregate에서만 유일하면 되고 영향 범위도 Aggregate에 한정되기 때문에 auto-increment 되는 정수형 ID를 사용한다.

만약 `AggregateRoot`의 ID를 UUID로 하는 것이 Database의 성능에 영향을 준다면 Database를 개선하거나 `AggregateRoot`를 Entity로 취급해야 하는 것은 아닌지 고민해야 한다. `AggregateRoot`의 ID 타입을 변경하면 안 된다.

### 2.2 TypeORM과 도메인의 Entity 관계

다음은 일반적인 Entity를 구현한 코드다.

```ts
@Entity()
export class Seed extends AggregateRoot {
    @Column()
    name: string

    @Column({ type: 'text' })
    desc: string

    @Column({ type: 'integer' })
    integer: number

    @Column('varchar', { array: true })
    enums: SeedEnum[]

    @Column({ type: 'timestamptz' })
    date: Date
}
```

Entity 코드와 Infrastructure 레이어에 위치하는 TypeORM의 코드가 섞여 있다. 두 레이어의 코드가 섞여 있지만 Entity 코드는 Infrastructure 코드를 참조하지 않는다.

마찬가지로 TypeORM의 @Column 데코레이터는 데이터 매핑을 위한 것이고, 이 코드가 도메인 객체 내에 있어도 도메인 로직에 영향을 미치지 않는다.

결과적으로, 도메인 객체에 TypeORM 코드가 추가된 것은 엔티티와 ORM 사이의 편리한 연결을 위한 것이다. 이것은 TypeORM이 도메인 엔티티에 의존하게 하고, 엔티티가 TypeORM에 의존하지 않게 한다. 이 구조는 DDD의 개념과 상충하지 않으며, 두 영역 간의 깔끔한 분리를 제공한다.

## 3. 그 외

### 3.1. index.ts 작성 시 순환 참조 문제

각 모듈 마다 아래처럼 모듈의 모든 요소를 export하는 index.ts를 만들었다. 이와 같은 방식은 순환참조 문제 가능성을 크게 높인다.

```ts
export * from './dto'
export * from './entities'
export * from './users.module'
export * from './users.service'
```

아래는 순환참조가 발생하는 코드다. 각각 AuthService와 User만 필요한데 각 모듈의 모든 요소를 import 하면서 문제가 된다.

```ts
// users/index.ts
export * from './entities'
export * from './users.module'
export * from './users.service'

// user.entity.ts
// auth의 모든 요소를 import 하게 된다.
import { AuthService } from './auth'

// auth/index.ts
export * from './auth.module'
export * from './auth.service'

// auth.service.ts
// users의 모든 요소를 import 하게 된다.
import { User } from './users'
```

그래서 적어도 모듈 단위의 index.ts는 정의하지 않기로 한다.

### 3.2. Authentication 모듈의 분리

UsersModule과 AuthModule로 분리되어 있었다. 그러나 다음의 이유로 UsersModule에 통합했다.

1. 만약 User의 종류가 둘이 된다면 Auth의 종류도 그에 맞게 생겨야 한다.
1. AuthModule로 분리해서 생기는 장점이 크지 않고 결합이 강해진다.

### 3.3. Assert, Expect

아래와 같이 expect 구문을 사용했었다. 그러나 이렇게 하면 vscode에서 showtime이 undefined가 아니라고 단정할 수 없어서 에러가 발생한다.

```js
Expect.found(showtime, `${showtime} not found`)
```

### 3.4. Exception의 테스트 작성

Exception을 발생시키는 것은 일반적인 방법으로 재현하기 어렵다. 그래서 Exception을 테스트 하려면 코드가 복잡해진다.
그에 반해 Exception을 처리하는 코드는 단순한 편이어서 테스트를 작성하는 이익이 크지 않다.

따라서 Exception에 대한 테스트는 작성하지 않는 것을 원칙으로 한다.

예외적으로 치명적인 Exception 발생 시 시스템을 shutdown 하는 것과 같이 단순 error reporting 이상의 기능이 있다면 테스트를 작성해야 한다.

### 3.5. Code Coverage 무시

아래처럼 Assert를 사용하면 code coverage를 무시하는 태그를 작성하지 않아도 된다.

```js
/* istanbul ignore if */
if (seed === undefined) {
    throw new LogicException(`Seed(${seedId}) not found`)
}

// 간단하게 작성한다
Assert.defined(seed, `Seed(${seedId}) not found`)
```

### 3.6. Test 작성

유닛 테스트를 클래스 마다 작성하는 것은 비용이 크다. e2e에 가까운 모듈 테스트를 작성해서 모듈 단위로 테스트를 작성하는 게 효율적이다.

테스트 코드는 반드시 완전한 e2e-test나 unit-test로 작성할 필요는 없다. 상황에 따라 어느 정도 균형을 맞춰야 한다.

### 3.7. Transaction

서비스 간 트랜잭션 핸들을 공유하지 않는다. 전통적인 트랜잭션 구조는 포기한다. 각 서비스가 MSA의 일부라고 가정한다.

### 3.8. Scope.REQUEST

아래와 같이 Scope.REQUEST로 설정된 TransactionService를 사용하면 scope bubble up 이 발생해서 unit 테스트가 어려워진다.

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

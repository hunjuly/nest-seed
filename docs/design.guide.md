# Nest Design Guide

### HATEOAS/HAL

-   HATEOAS 또는 HAL은 완전한 자체 설명을 지원하는 것은 어렵고 복잡합니다. 자체 설명이 정말 필요한 경우 GRPC를 대안으로 사용할 수 있습니다.

    ```sh
    curl -u admin:admin -X GET "http://localhost:8080/confluence/rest/api/space/ds/content/page?limit=5&start=5"
    ```

    ```json
    {
        "limit": 5,
        "results": [
            {
                "_expandable": {
                    "ancestors": "",
                    "children": "/rest/api/content/98308/child",
                    "history": "/rest/api/content/98308/history",
                    "version": ""
                },
                "_links": {
                    "self": "http://localhost:8080/confluence/rest/api/content/98308",
                    "webui": "/pages/viewpage.action?pageId=98308"
                }
            }
        ],
        "size": 5,
        "start": 0
    }
    ```

### 컨트롤러에서 엔티티를 DTO로 변환하는 이유

1. REST API나 Microservice에서 요구하는 데이터 형식이 다를 수 있다.
2. 서비스에서 변환하면 서비스가 컨트롤러에 종속되는 문제가 발생한다.
3. 서비스에서 변환하면 다른 서비스가 사용할 때 DTO를 받게된다. 그러나 DTO는 컨트롤러에서만 사용해야 한다. 컨트롤러에서 예외를 던지는 이유 컨트롤러는 단순히 데이터 변환과 송수신을 담당한다.
4. 그러나 Http냐 RPC냐에 따라서 던져야 하는 예외가 달라진다.
5. 서비스는 다른 서비스를 사용한다. 컨트롤러도 서비스를 사용하는 것이다. 서비스를 사용하는 주체의 동작은 동일해야 한다. 다른 서비스에서도 예상 가능한 예외는 사전에 점검하기 때문에 컨트롤러도 동일한 구조를 가지는 것이 좋다.

### find vs get

-   findById(seedId: string)\
    주어진 seedId에 해당하는 Seed를 찾아서 반환합니다. 만약 해당 Seed가 없다면 null을 반환합니다. 이 메서드는 Seed가 존재하지 않아도 예외를 발생시키지 않습니다.
-   getSeed(seedId: string)\
    주어진 seedId에 해당하는 Seed를 찾아서 반환합니다. 만약 해당 Seed가 없다면 예외를 발생시킵니다. 이 메서드는 Seed가 존재하지 않을 경우 예외를 발생시키는 것이 자연스럽습니다.

### 엔티티 Id type

uuid는 고유 식별자를 생성하는 방법 중 하나이며, 자동으로 문자열 형태의 값을 생성합니다. uuid를 사용하는 것이 데이터베이스의 성능과 관련이 있다면, uuid를 사용하는 대신 auto-increment 되는 정수형 ID를 사용하는 것이 더 좋을 수 있습니다. 그러나 성능의 문제가 없다면 uuid를 사용하는 것이 데이터베이스에 더 많은 유연성을 제공할 수 있습니다.

### typeorm과 도메인의 엔티티 관계

Q : typeorm의 코드는 infrastructure 레이어에 포함되는거 아니야? DDD에서는 도메인 레이어와 infrastructure 레이어를 구분하게 되어있는데 entities가 왜 domain 폴더의 하위에 있지?

A: 일반적으로, DDD에서 도메인 레이어는 도메인의 핵심 비즈니스 로직과 개념을 포함하고,
인프라스트럭처 레이어는 도메인의 구현을 위한 기술적 세부 사항을 다룹니다.\
TypeORM과 같은 ORM 프레임워크를 사용할 때, entity는 도메인 객체의 구현에 필요한 기술적 세부 사항을 포함합니다. 그러나 entity는 여전히 도메인 모델의 일부이므로 도메인 레이어에서 구현되어야합니다.\
즉, entities가 domain 폴더의 하위 폴더에 위치하는 것은 일반적인 구조입니다. 이러한 구조를 사용하면 도메인과 구현 사이의 경계를 유지하면서 도메인 모델과 데이터베이스 스키마 간의 매핑을 쉽게 할 수 있습니다.\
마찬가지로, 서비스는 도메인 객체를 조작하고 도메인 로직을 캡슐화하기 때문에 도메인 레이어에 위치하는 것이 일반적입니다. 이렇게 하면 서비스가 도메인 객체와 도메인 로직을 더 잘 캡슐화 할 수 있으며, 비즈니스 규칙의 변화에 대응하기 쉽습니다.

요약하면, 도메인 객체에 TypeORM 코드가 추가된 것이다. TypeORM이 도메인 엔티티에 의존하는 것이지 엔티티가 TypeORM에 의존하는 것이 아니다.

### 서비스의 레이어

`서비스에도 레이어가 존재한다.`

movies, theaters, users는 기본 서비스다. \
다른 응용 서비스가 이런 기본 서비스를 사용한다. \
기본 서비스는 응용 서비스를 모른다.

예를 들어 상영 일정은 /showtimes에 있다. 그런데 상영 중인 영화 목록을 /showtimes로 구해오는 것은 직관적이지 않다.
그렇다고 /movies로 구해오면 movies 서비스가 showtimes 서비스를 참조해야 한다.
이런 경우 showtimes 서비스가 업데이드 될 때 필요한 정보를 movies에 업데이트 한다.
movies는 영화의 상영 일정에 대한 정보를 갖는다. 이러면 movies는 showtimes를 몰라도 된다.

요약하면, `레이어 아키텍쳐처럼 서비스도 레이어가 있다.`

그리고 기초 서비스는 같은 레이어가 아니라 각각이 독립적이다. 기초 서비스는 서로 참조하지 않는다.

```
"Foundation Services" (기초 서비스): 이 서비스들은 자체적으로 독립적이며, 다른 서비스에 의존하지 않습니다. 이들은 가장 기본적인 기능을 제공하며, users, movies, theaters 등이 이에 해당합니다.

"Composite Services" (복합 서비스): 이 서비스들은 하나 이상의 기초 서비스를 기반으로 작동하며, 이들의 기능을 결합하거나 확장하여 더 복잡한 기능을 제공합니다. showtimes, tickets 등이 이에 해당합니다.
```

### 서비스의 책임

Q: movies,theaters,tickets,showtimes 등 파운데이션 서비스는 최대한 다른 서비스를 이용하지 않고 컴포지트 서비스가 각 서비스를 이해하고 이용하도록 디자인 가이드라인을 정했는데 부적절해?
파운데이션 서비스는 다양한 서비스에 이용되니까 변화가 적은게 유리하고 그러면 다른 서비스를 이용하지 않는 독립된 서비스로 유지하는게 좋지 않아?

A: 네, 그런 디자인 가이드라인이 적합하다고 할 수 있습니다. 서비스 간의 결합도를 최소화하는 것은 마이크로서비스 아키텍처의 핵심 원칙 중 하나이며, 이는 시스템의 유지보수성과 확장성을 높이는 데 도움이 됩니다.

이러한 가이드라인을 따르면, 각 '파운데이션 서비스'는 자신의 비즈니스 로직을 담당하며, 다른 서비스의 비즈니스 로직을 알 필요가 없습니다. 그 결과로 각 서비스는 독립적으로 개발, 배포, 스케일링이 가능하게 됩니다.

'컴포지트 서비스'인 'screening'이 여러 '파운데이션 서비스'를 조합하여 비즈니스 로직을 수행하는 것은 적절한 설계로 볼 수 있습니다. '컴포지트 서비스'는 종종 여러 '파운데이션 서비스'를 이용하여 더 복잡한 연산을 제공하며, 이는 마이크로서비스 아키텍처의 장점 중 하나입니다.

다만, `'컴포지트 서비스'가 '파운데이션 서비스'의 내부 구현에 대해 너무 많이 알게 되면 서비스 간의 결합도가 높아질 수 있으므로, 이 부분에 대해선 주의가 필요합니다. 서비스 간의 통신은 정의된 API를 통해 이루어지며, 각 '파운데이션 서비스'의 내부 구현은 캡슐화되어야 합니다.`

결국 ticket에 seat 정보를 포함해서 ticketWithSeat를 만들 필요 없도록 했다. seat를 ticket을 만들기 위한 템플릿으로 해석했다. 만약 seat정보를 포함하는 ticket을 ScreeningService에서 만들었으면 이런 변화에 취약했을 것이다. 결론은 gpt 말이 맞다.

### REST API

REST API에 대해서 많은 고민 끝에 이렇게 하기로 정했다.

사용자 입장에서 좋은 REST API다

```js
/movies/screening
/theaters/screening
```

그러나 구현하는 입장에서 이렇게 되면 movies 컨트롤러가 다양한 서비스를 참조해야 한다. 그러면 아예 컨트롤러들을 별도의 모듈로 관리하는게 좋아 보인다. 그런데 그렇게 되면 응집성이 떨어져서 결국 유지보수가 어렵다.

개발자 입장에서 좋은 REST API다

```js
/screening/movies
/screening/theaters
```

이렇게 하면 screening이라는 서비스에 관련 기능이 모두 모여서 개발이 수월하다.

여기까지 봤을 떄는 둘 중 뭘 선택해야 할 지 고민스러웠다.
그러나, movies나 theaters같은 Foundation Service는 거의 변화가 없다. screening이나 upcoming등 기초 서비스 위에서 동작하는 복합 서비스가 계속 변경/추가된다.

그렇다면 개발하는 입장에서는 압도적으로 /screening을 앞에 두는게 좋다. 또한 사용자 입장에서도 rest api가 계속 변경되기 보다 새로운 rest api가 추가되는 것이 좋을 것이다.

아래는 그 외에 세부적인 디자인 지침이다.

-   상영 중인 영화 목록은 영화 목록을 반환한다. 그러면 `/movies`로 시작해야 한다. \
    그런데 `'상영 중'은 showtimes 서비스`와 연관된다. \
    이런 경우 `/movies/screening`처럼 엔드포인트를 설정한다.\
    원칙은 `/movies?status=screening` 이렇게 query를 사용는 것이다.\

    ```js
    //원칙
    /movies?status=screening
    //타협, movies 컨트롤러에서 showtimes 서비스 호출
    /movies/screening
    //잘못된 설계
    /showtimes?status=screening&groupby=movie
    ```

-   GET이나 DELETE 메소드인데 쿼리가 너무 길어서 POST로 동작해야 하는 경우.\
    쿼리가 길다는 것은 어차피 캐싱이 의미없는 경우가 대부분이다.

    ```js
    // GET = 검색 함수를 실행한다.
    POST /movies/search
    // DELETE = 삭제 함수를 실행한다.
    POST /movies/delete
    ```

    GET과 POST를 선택할 때는 몇 가지 중요한 사항을 고려해야 합니다:

    GET은 데이터를 검색하는 데 사용되며, URL에 쿼리 문자열로 전달됩니다. 이것은 아래의 경우에 적합합니다:\
    전달할 데이터가 매우 적고 간단한 경우\
    캐싱이 필요한 경우\
    북마크 가능성이나 주소창을 통한 URL 공유가 필요한 경우

    POST는 서버에 데이터를 전송하거나 생성하기 위해 사용됩니다. 이것은 아래의 경우에 적합합니다:\
    전달할 데이터가 많거나 복잡한 경우 (예: 파일, 긴 텍스트 등)\
    데이터가 민감한 경우 (예: 패스워드, 개인 정보 등)\
    서버의 상태를 변경하는 동작을 수행하는 경우 (예: 리소스 생성, 수정)\
    따라서 복잡한 검색 필터를 사용하거나, 대량의 검색 조건을 전달하거나, 민감한 정보를 포함하는 경우에는 \POST를 사용하는 것이 더 적합할 수 있습니다.

    반면에, 검색 필터가 간단하거나 URL을 통해 검색 결과 페이지를 공유하거나 북마크하려는 경우에는 GET을 사용하는 것이 적합합니다.

-   REST API 디자인에서는 URI가 길어지거나 깊어지는 것을 피하라는 권장사항이 있습니다. 이는 API를 간결하고, 명확하게, 그리고 가능한 한 직관적으로 유지하는데 목표를 두고 있습니다.

    `/movies/{movieId}/screening/theaters` 는 4 뎁스(depth)를 가지고 있지만, 각 세그먼트(segment)가 명확한 리소스를 지칭하고 있어서 이해하기 쉽습니다. 영화(movie), 특정 영화의 상영 정보(screening), 그리고 그 상영이 이루어지는 극장(theaters)을 명시적으로 지칭하고 있습니다.

    위와 같이 전체 경로에 {id}는 하나만 나오게 한다.나머지는 필터다. `/movies/{movieId}/screening/theaters/{id}` 이렇게 하지 않는다.

    그럼에도 불구하고 이 API를 좀 더 단순하게 만들고 싶다면, `/theaters/screening?movieId={movieId}&orderby=distance:asc&lon=35.123&lat=173.412` 와 같은 형식으로 수정할 수도 있을 것입니다. 이러한 수정은 '/screening/theaters'라는 엔드포인트를 통해 상영 중인 극장 목록을 제공하되, 특정 영화를 필터링하는 쿼리 파라미터(`movieId={movieId}`)를 제공하는 방식입니다.

    그러나 이는 API의 명확성을 손상시킬 수도 있습니다. 따라서 더 간단하게 만드는 것과 더 명확하게 만드는 것 사이에서 적절한 균형을 찾는 것이 중요합니다. 구체적인 디자인은 서비스의 전반적인 요구사항, 사용자의 요구, 그리고 팀의 코드 관리 기준에 따라 달라질 것입니다.

### Database

SQLite와 PostgreSQL은 각각 다른 장점을 가지고 있습니다. SQLite는 서버가 필요 없으며 설정이 간단하며, 테스트 환경이나 개발 초기 단계에서는 매우 편리합니다. 반면 PostgreSQL은 확장성이 뛰어나며, 강력한 기능을 제공하므로 복잡한 쿼리를 처리하는 데 매우 적합합니다.

그러나, 두 데이터베이스가 동일한 SQL 표준을 완전히 지원하지 않으므로, 동일한 애플리케이션 코드가 두 데이터베이스에서 동일하게 작동하도록 만드는 것은 약간의 추가 작업이 필요할 수 있습니다. 특히 데이터 타입, 인덱싱, 성능 최적화와 같은 영역에서는 데이터베이스가 다르면 다르게 작동할 수 있습니다.

따라서, `두 데이터베이스를 동시에 사용하려면 어느 정도의 오버헤드가 발생합니다.` 이는 코드베이스를 유지 관리하는 데 추가 작업이 필요하다는 것을 의미하며, 이는 더 많은 시간과 노력을 필요로 합니다.

그러나 이 오버헤드가 개발과 테스팅을 쉽게 하고, 애플리케이션을 보다 견고하게 만드는 데 도움이 된다면, 이는 가치 있는 투자일 수 있습니다. 가장 중요한 것은 애플리케이션의 요구사항과 팀의 능력을 고려하여 가장 적합한 데이터베이스 전략을 선택하는 것입니다.

마지막으로, `테스트와 운영 환경에서 같은 데이터베이스를 사용하면 애플리케이션의 실제 동작을 더 정확하게 이해하고 예측할 수 있다는 장점이 있습니다.` 따라서 가능하다면 테스트와 운영 환경에서 동일한 데이터베이스를 사용하는 것이 좋습니다.

단일 프로젝트에서는 단일 DB를 사용한다. 다만, common lib는 테스트를 위해서 sqlite를 사용했다.

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

### 컨트롤러에서 엔티티를 DTO로 변환하는 이유

1. REST API나 Microservice에서 요구하는 데이터 형식이 다를 수 있다.
2. 서비스에서 변환하면 서비스가 컨트롤러에 종속되는 문제가 발생한다.
3. 서비스에서 변환하면 다른 서비스가 사용할 때 DTO를 받게된다. 그러나 DTO는 컨트롤러에서만 사용해야 한다.

### 컨트롤러에서 예외를 던지는 이유

컨트롤러는 단순히 데이터 변환과 송수신을 담당한다.\
그러나 Http냐 RPC냐에 따라서 던져야 하는 예외가 달라진다.\
서비스는 다른 서비스를 사용한다. 컨트롤러도 서비스를 사용하는 것이다.\
서비스를 사용하는 주체의 동작은 동일해야 한다.\
다른 서비스에서도 예상 가능한 예외는 사전에 점검하기 때문에 컨트롤러도 동일한 구조를 가지는 것이 좋다.

### index.ts는 주의해야 한다

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

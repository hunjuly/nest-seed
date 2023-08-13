# Design Guide

`Layered Modules`는 이 프로젝트의 핵심 개념이다. 이 프로젝트의 REST API 디자인은 `Layered Modules` 개념을 반영한 것이다.

## 1. Layered Modules

'영화 예매 시스템'에서 `screening`, `tickets`, `showtimes` Module은 `movies`, `theaters`, `users` Module을 참조한다.

```
+----------------------------------+
| Composite Module                 |
| (screening, tickets, showtimes)  |
+----------------------------------+
                |
                v
+-------------------------------+
| Foundation Module             |
| (movies, theaters, users)     |
+-------------------------------+
```

예를 들어, 상영일정을 관리하는 `showtimes` Module은 `movies`, `theaters` Module을 알아야 한다. 이렇게 기본 정보를 제공하는 `Foundation Module`과 그 Module을 사용하는 `Composite Module`이 있는데 이 관계를 `Layered Modules`라고 정의한다.

-   `Foundation Module`
    -   이 모듈은 자체적으로 독립적이며, 다른 모듈에 의존하지 않는다. 이들은 가장 기본적인 기능을 제공한다.
    -   `Foundation Module`은 다른 `Foundation Module`을 참조하지 않는다.
-   `Composite Module`
    -   이 모듈은 하나 이상의 `Foundation Module`를 기반으로 작동하며, 이들의 기능을 결합하거나 확장하여 더 복잡한 기능을 제공한다.
    -   `Composite Module`는 `Foundation Module`와 다른 `Composite Module`를 참조할 수 있다.

### 1.1 Composite Modules의 방향성

`Composite Module`은 방향성을 가진다. 즉, 상호 참조를 허용하지 않는다. 상호 참조 대신 Module을 하나로 합치던가 새로운 `Composite Module`을 만든다.

```sh
# Module은 위에서 아래로 흐른다
   +----------------------+
   |      Screening       |
   +----------------------+
         |           |
         |           |
         v           v
 +-----------+   +-----------+
 | Tickets   |   | Showtimes |
 +-----------+   +-----------+
        |           |
        v           v
+-----------------------------+
|  movies, theaters, users    |
+-----------------------------+
```

## 2. REST API Design

### 2.1. 시작 순서

다음은 REST API로 요청하는 리소스가 앞에 오고 필터가 뒤따라 오는 설계다.

```sh
# 상영중인 영화 목록
/movies/screening

# 상영중인 극장 목록
/theaters/screening
```

이렇게 하면 movies나 theaters 서비스가 다른 서비스를 참조하면서 기능이 점점 커진다.

타협안으로 MoviesController에서 ScreeningService를 호출하는 방법도 있다. 그러나 이것은 의존성이 높아져서 결국 유지보수가 어려워 진다.

다음은 필터가 앞에 오고 요청하는 리소스가 뒤에 오는 설계다.

```sh
# 상영중인 영화 목록
/screening/movies

# 상영중인 극장 목록
/screening/theaters
```

이렇게 하면 screening 서비스에 관련 기능이 모두 모여서 개발이 수월하다. 다른 기능이 추가되더라도 movies나 theaters 서비스는 변경하지 않아도 된다.

여기까지 봤을 떄는 둘 중 뭘 선택해야 할 지 고민스러웠다.
그러나, movies나 theaters같은 Foundation Service는 거의 변화가 없다. screening이나 upcoming등 기초 서비스 위에서 동작하는 복합 서비스가 계속 변경/추가된다.

그렇다면 개발하는 입장에서는 압도적으로 /screening을 앞에 두는게 좋다. 또한 사용자 입장에서도 rest api가 계속 변경되기 보다 새로운 rest api가 추가되는 것이 좋을 것이다.

### 2.2. Shallow VS Nested Routing

REST API 디자인에서는 URI가 길어지거나 깊어지는 것을 피하라는 권장사항이 있습니다. 이는 API를 간결하고, 명확하게, 그리고 가능한 한 직관적으로 유지하는데 목표를 두고 있습니다.

`/movies/{movieId}/screening/theaters` 는 4 뎁스(depth)를 가지고 있지만, 각 세그먼트(segment)가 명확한 리소스를 지칭하고 있어서 이해하기 쉽습니다. 영화(movie), 특정 영화의 상영 정보(screening), 그리고 그 상영이 이루어지는 극장(theaters)을 명시적으로 지칭하고 있습니다.

위와 같이 전체 경로에 {id}는 하나만 나오게 한다.나머지는 필터다. `/movies/{movieId}/screening/theaters/{id}` 이렇게 하지 않는다.

그럼에도 불구하고 이 API를 좀 더 단순하게 만들고 싶다면, `/theaters/screening?movieId={movieId}&orderby=distance:asc&lon=35.123&lat=173.412` 와 같은 형식으로 수정할 수도 있을 것입니다. 이러한 수정은 '/screening/theaters'라는 엔드포인트를 통해 상영 중인 극장 목록을 제공하되, 특정 영화를 필터링하는 쿼리 파라미터(`movieId={movieId}`)를 제공하는 방식입니다.

그러나 이는 API의 명확성을 손상시킬 수도 있습니다. 따라서 더 간단하게 만드는 것과 더 명확하게 만드는 것 사이에서 적절한 균형을 찾는 것이 중요합니다. 구체적인 디자인은 서비스의 전반적인 요구사항, 사용자의 요구, 그리고 팀의 코드 관리 기준에 따라 달라질 것입니다.

상영 중인 영화 목록은 영화 목록을 반환한다. 그러면 `/movies`로 시작해야 한다. 그런데 `'상영 중'은 showtimes 서비스`와 연관된다. 이런 경우 `/movies/screening`처럼 엔드포인트를 설정한다. 원칙은 `/movies?status=screening` 이렇게 query를 사용는 것이다.

    ```js
    //원칙
    /movies?status=screening
    //타협, movies 컨트롤러에서 showtimes 서비스 호출
    /movies/screening
    //잘못된 설계
    /showtimes?status=screening&groupby=movie
    ```

### 2.3. GET과 POST 선택

10,000명의 user정보 검색 요청은 너무 길어서 전달할 수 없다.

```js
GET /users?user-id=userid1, userid2, userid3 ...
```

이렇게 `GET`이나 `DELETE` 메소드인데 쿼리가 너무 길다면 아래처럼 POST로 요청한다.

```js
// 검색을 한다
GET /movies?...
// 검색을 실행한다
POST /movies/search

// 삭제를 한다
DELETE /movies?...
// 삭제를 실행한다
POST /movies/delete
```

POST 메소드는 일반적으로 `Create`를 의미하지만 `함수를 실행한다`는 의미로도 사용한다.

GET과 POST를 선택할 때는 몇 가지 사항을 고려해야 한다.

-   GET이 적합한 경우
    -   전달할 데이터가 매우 적고 간단한 경우
    -   캐싱이 필요한 경우
    -   북마크 가능성이나 주소창을 통한 URL 공유가 필요한 경우
-   POST가 적합한 경우
    -   전달할 데이터가 많거나 복잡한 경우 (예: 파일, 긴 텍스트 등)
    -   데이터가 민감한 경우 (예: 패스워드, 개인 정보 등)
    -   서버의 상태를 변경하는 동작을 수행하는 경우 (예: 리소스 생성, 수정)

### 2.4. Self Descriptive API 제한

HATEOAS(Hypermedia as the engine of application state)의 완전한 자체 설명을 구현하는 것은 어렵고 복잡하다.
단순 link 정도의 수준으로 제공해야 하며 복잡한 API는 문서로 설명해야 한다.

문서를 완전히 대체하려는 노력 보다는 오류를 더 자세히 처리하는 코드를 작성하는 것이 효율적이다.

```json
// 일반적인 HATEOAS의 예
{
    "results": [
        {
            "_expandable": {
                "children": "/rest/api/content/98308/child",
                "history": "/rest/api/content/98308/history"
            },
            "_links": {
                "self": "http://localhost:8080/confluence/rest/api/content/98308",
                "webui": "/pages/viewpage.action?pageId=98308"
            }
        }
    ]
}
```

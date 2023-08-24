# Design Guide

이 문서는 Back-End 소프트웨어를 설계할 때 고려해야 할 구조적 및 기능적 원칙을 정리한 것이다.


## 1. 상호 참조

어떤 경우라도 상호참조는 하지 않는다. 상호참조가 필요하면 그 부분만 별도의 서비스로 만들거나 두 서비스를 하나로 합쳐야 한다.
이 규칙은 서비스, 모듈, 클래스 등 규모에 상관없이 동일하게 적용된다.

## 2. REST API

### 2.1. URL 구성 순서

다음은 요청하는 리소스가 앞에 오고 필터가 뒤따라 오는 REST API 설계이다.

```sh
# 상영중인 영화 목록
/movies/screening

# 상영중인 극장 목록
/theaters/screening
```

이렇게 하면 movies나 theaters 서비스가 다른 서비스를 참조하면서 복잡도가 증가한다.

```sh
# 주간 베스트 영화 목록
/movies/weekly-best

# 영화 abc123의 리뷰들
/movies/abc123/reviews
...
```

위와 같이 movies와 관련된 기능을 추가하면 movies 모듈은 weekly 모듈과 reviews 모듈을 추가로 참조해야 한다.

대안으로 MoviesController에서 ScreeningService를 호출하는 방법도 있다. 그러나 이것은 의존성이 높아져서 결국 유지보수가 어려워 진다.

다음은 필터가 앞에 오고 요청하는 리소스가 뒤에 오는 설계이다.

```sh
# 상영중인 영화 목록
/screening/movies

# 상영중인 극장 목록
/screening/theaters

# 주간 베스트 영화 목록
/weekly-best/movies

# 영화 abc123의 리뷰들
/reviews/movies/abc123
...
```

이렇게 하면 screening 서비스와 관련된 기능이 모두 모여서 개발이 수월하다. 다른 기능이 추가되더라도 `movies`나 `theaters` 서비스는 변경하지 않아도 된다.
REST API를 위와 같이 한다면 `screening`,`weekly-best`, `reviews` 서비스 모듈을 만들어야 한다.

### 2.2. Shallow Routing VS Nested Routing

REST API의 라우팅 디자인은 크게 `Shallow Routing`과 `Nested Routing`이 있다.

`Shallow Routing`은 각 리소스를 독립적으로 관리할 수 있으므로 확장성이 좋다. 그러나 리소스 간의 관계를 명확하게 표현하지 않기 때문에 복잡한 계층 구조의 데이터를 표현하는데 어려움이 있다.

`Nested Routing`은 리소스 간의 관계를 URL에서 명확하게 표현할 수 있으므로, 복잡한 리소스 구조를 표현하는데 적합하다. 그러나 중첩된 리소스 구조가 변경될 경우, URL도 함께 변경되어야 하므로 유연성이 제한된다.

```sh
# Shallow Routing
/screening?movieId={movieId}&theaterId={theaterId}

# Nested Routing
/screening/movies/{movieId}/theaters/{theaterId}
```

`Foundation Module`은 다른 모듈을 참조하지 않기 때문에 `Shallow Routing`으로 디자인 한다. `Composite Module`은 `Nested Routing`이 적당한 경우도 있을 것이다.
중요한 것은 이 라우팅 지침은 절대적인 것이 아니다. 개념적인 관점에서 리소스의 구조가 중첩되는 것인지를 우선해서 판단해야 한다.

### 2.3. GET과 POST 선택

10,000명의 user정보 검색 요청은 너무 길어서 GET 메소드로 전달할 수 없다.

```sh
GET /users?user-id=userid1, userid2, userid3 ...
```

이렇게 `GET`이나 `DELETE` 메소드인데 쿼리가 너무 길다면 아래처럼 POST로 요청한다.

```sh
# 찾는다
GET /movies?...
# 찾기를 실행한다
POST /movies/find

# 삭제를 한다
DELETE /movies?...
# 삭제를 실행한다
POST /movies/delete
```

POST 메소드는 일반적으로 `Create`를 의미하지만 `함수를 실행한다`는 의미로도 사용한다.

GET과 POST를 선택할 때는 다음의 사항을 고려해야 한다.

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

문서를 완전히 대체하려는 노력보다는 오류 정보를 더 자세히 출력하는 코드를 작성하는 것이 효율적이다.

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

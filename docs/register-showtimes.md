# Create Showtimes

goal : 하나의 영화를 여러 극장에 상영 시간 등록하기

description : 이 유스케이스는 하나의 영화에 대해 여러 극장에 상영 시간을 등록하는 기능을 설명합니다.

actor: admin

preconditions :

-   관리자는 시스템에 로그인해야 합니다.
-   영화와 극장은 이미 시스템에 등록되어 있어야 합니다.

trigger:

-   관리자가 영화 상영 시간 등록 페이지를 방문합니다.

main flow :

1. 시스템은 현재 등록된 영화 목록을 보여줍니다.
1. 관리자는 상영 시간을 등록하려는 영화를 선택합니다.
1. 시스템은 현재 등록된 극장 목록을 보여줍니다.
1. 관리자는 상영 시간을 등록하려는 극장들을 선택합니다.
1. 관리자는 각 극장에 대한 상영 시간을 입력합니다.
1. 관리자는 상영 시간을 등록합니다.
1. 시스템은 등록한 상영 시간이 기존의 상영 시간과 겹치는지 검사합니다.
1. 만약 겹치지 않는다면, 시스템은 상영 시간을 등록하고, 상영 시간 등록이 완료되었다는 메시지를 보여줍니다.

Exception Flow :

-   만약 상영 시간이 기존의 상영 시간과 겹친다면
    1. 시스템은 상영 시간 등록에 실패했다는 메시지와 함께 어떤 상영 시간이 겹쳤는지 정보를 보여줍니다.
    1. 기본 흐름 5단계로 돌아갑니다.

Postconditions :

-   선택한 극장에서 선택한 영화의 상영 시간이 성공적으로 등록되어야 합니다.
-   데이터베이스에 등록한 상영 시간 정보가 반영되어야 합니다.
-   상영시간에 해당하는 티켓이 생성되어야 한다.

## 상영 시간 충돌 검증 알고리즘 컨셉

상영 시간은 최소 10분 단위다.

기존에 등록되어 있던 showtime[]을 set<number>로 등록한다.

예를 들어 2023/12/31 09:00 - 10:40이면

202312310900,202312310910,202312310920 이렇게 등록한다.

그러면 바로 비교 가능하다.

## 시퀀스

```plantuml
@startuml
actor admin as "Admin"
control front as "Front-end"
boundary back as "Back-end"
participant movies as "MoviesService"
participant theaters as "TheatersService"
participant showtimes as "ShowtimesService"
participant tickets as "TicketsService"

admin -> front: 상영시간 등록 시작
front -> back: GET /movies?orderby=createat:desc
back -> movies: findMovies({orderby='desc:createat'})
movies -> movies: getMovies()
back <-- movies: movies[]
front <-- back: movieDtos[]
admin <-- front: 등록된 영화 목록
admin -> front: 영화 선택
front -> back: GET /theaters
back -> theaters: findTheaters()
theaters -> theaters: getTheaters()
back <-- theaters: theaters[]
front <-- back: theaterDtos[]
admin <-- front: 등록된 극장 목록

admin -> front: 극장 선택
front -> back: GET /showtimes?time=future&theaterId={theaterId}
back -> showtimes: findFutureShowtimes(theaterIds)
showtimes -> showtimes: findShowtimes(now<startDatetime, theaterId)
back <-- showtimes: futureShowtimes[]
front <-- back: futureShowtimesDtos[]
admin <-- front: 선택한 극장의 미래 상영시간 목록

admin -> front: 선택한 극장에 대한 상영 시간 입력
front -> back: POST /showtimes
back -> showtimes: batchCreateShowtimeDtos[]
    note right
    BatchCreateShowtimeDtos[] = [
        {
            "movieId": "movie#1",
            "theaterId": "theater#1",
            "showtimes": [
                { "startDatetime": 202012120900 },
                { "startDatetime": 202012121100 },
                { "startDatetime": 202012121300 }
            ]
        }
    ]
    end note
showtimes -> showtimes: validateShowtimes(batchCreateShowtimes)
    note right
    상세 알고리즘은 별첨
    end note

loop batchCreateShowtime of batchCreateShowtimes
    loop showtimeData of batchCreateShowtime.showtimes
        showtimes -> showtimes: save(showtimeData)
        return showtime
        showtimes -> tickets: createTickets(showtime.id, batchCreateShowtimeDto.theaterId)
        tickets -> theaters: getTheater(theaterId)
        tickets <-- theaters: theater
        tickets -> tickets: createTickets(theater.seats)
    end
end
showtimes -> back: completed
front <-- back: completed
admin <-- front: 등록 완료
@enduml
```

```plantuml
@startuml
start
note
validateShowtimes()
end note
:createShowtimesDtos[] 가져오기;
note
200개의 극장
60일의 상영일
8회차
200*60*8=96,000개의 showtime이 있을 것으로 가정함.

[
    {
        "movieId": "movie#1",
        "theaterId": "theater#1",
        "showtimes": [
            { "startDatetime": 202012120900 },
            { "startDatetime": 202012121100 },
            { "startDatetime": 202012121300 }
        ]
    }
]
end note

repeat :createDto=createShowtimesDtos[i++];
  :{movieId, theaterId, showtimes} = createDto;
  :movieId & theaterId의 모든 future showtimes 가져오기;
  note
  futureShowtimes =
  findAfterDatetime(movieId, theaterId, now)
  현재 시간 이전은 필요없다. 현재 시간 이후는 많지 않다.
  end note
  repeat :futureShowtime = futureShowtimes[i++];
    :time=futureShowtime;
    repeat :time = time+10;
    :times.set(time);
note
    10분 단위로 모든 future showtime을 set에 등록한다.
    그 후, 만들려는 시간=createShowtime이 times에 존재하면
    해당 createShowtime은 기존 시간과 충돌하는 것이다.
end note
    repeat while(time < futureShowtime.endDatetime)
  repeat while

  repeat :showtime = showtimes[i++];
    if (times.exists(showtime)) then (Y)
      :conflictingShowtimes에 추가;
    endif
  repeat while(i<10 이런 식으로 종료 조건을 명시하자)
repeat while

:conflictingShowtimes 반환;
note
ValidationResultDto
{
    status: 'success' | 'fail';
    errors: [
        {
            movieId: "movie#1",
            theaterId: "theater#1",
            conflictingShowtimes: [
                { startDatetime: 202012120900 }
            ]
        }
    ]
}
end note
stop
@enduml
```

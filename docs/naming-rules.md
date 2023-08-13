## Naming Rules

### 2. find vs get

-   findById(seedId: string)\
    주어진 seedId에 해당하는 Seed를 찾아서 반환합니다. 만약 해당 Seed가 없다면 null을 반환합니다. 이 메서드는 Seed가 존재하지 않아도 예외를 발생시키지 않습니다.
-   getSeed(seedId: string)\
    주어진 seedId에 해당하는 Seed를 찾아서 반환합니다. 만약 해당 Seed가 없다면 예외를 발생시킵니다. 이 메서드는 Seed가 존재하지 않을 경우 예외를 발생시키는 것이 자연스럽습니다.

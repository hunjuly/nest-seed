# Naming Rules

## find vs get

함수명이 find...인 경우와 get...인 경우가 있는데 요청한 리소스가 없을 때 처리 방법이 다르다.

```ts
/**
 * 만약 해당 Seed가 없다면 null을 반환한다.
*/
findSeed(seedId: string)

/**
 * 만약 해당 Seed가 없다면 예외를 발생시킵니다.
*/
getSeed(seedId: string)
```

찾는 것이 없을 수도 있기 때문에 find는 null을 반환한다. 그러나 존재하지 않는 것을 가지려고 한다면 오류이기 때문에 get은 예외를 발생시킨다.

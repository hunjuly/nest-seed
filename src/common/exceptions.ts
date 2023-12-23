export class Exception extends Error {
    constructor(message?: string) {
        super(message)
        this.name = this.constructor.name
    }
}

/**
 * 일어날 수 없거나 일어나서는 안 되는 예외.
 * 즉시, 전체 시스템을 멈추고 문제의 원인을 찾아야 한다.
 */
export class FatalException extends Exception {}

/**
 * 코드 로직에서 잘못된 상태나 동작에 의해 발생하는 예외입니다.
 * 이는 프로그래머의 실수로 발생하는 경우가 대부분입니다.
 */
export class LogicException extends FatalException {}

export class InvalidArgumentException extends Exception {}

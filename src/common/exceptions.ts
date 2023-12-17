/* istanbul ignore file */

/**
 * 일어날 수 없거나 일어나서는 안 되는 예외.
 * 즉시, 전체 시스템을 멈추고 문제의 원인을 찾아야 한다.
 */
export class FatalException extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'FatalException'
    }
}

/**
 * 코드 로직에서 잘못된 상태나 동작에 의해 발생하는 예외입니다.
 * 이는 프로그래머의 실수로 발생하는 경우가 대부분입니다.
 */
export class LogicException extends FatalException {
    constructor(message?: string) {
        super(message)
        this.name = 'LogicException'
    }
}

/**
 * 환경 설정에 문제가 있어 발생하는 예외.
 * 전체 시스템에 영향을 주는 것은 아니다. 그러나 개별 인스턴스는 종료해야 한다.
 */
export class ConfigException extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'ConfigException'
    }
}

export class InvalidArgumentException extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'InvalidArgumentException'
    }
}

/**
 * 트랜잭션 사용 중 발생하는 예외.
 * DB 상태에 따라 일시적으로 발생할 수 있기 때문에 시스템을 종료하지 않는다.
 */
export class TransactionException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TransactionException'
    }
}

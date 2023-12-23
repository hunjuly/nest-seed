/* istanbul ignore file */

import { Exception } from 'common'

export class TypeormException extends Exception {}

export class EntityNotFoundTypeormException extends TypeormException {}

/**
 * 트랜잭션 사용 중 발생하는 예외.
 * DB 상태에 따라 일시적으로 발생할 수 있기 때문에 시스템을 종료하지 않는다.
 */
export class TransactionException extends TypeormException {}

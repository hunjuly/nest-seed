import { isEqual } from 'lodash'
import { LogicException } from './exceptions'

/**
 * 명백한 논리 에러나 그 외 예측하지 못한 에러들
 * 이런 것들은 즉시 시스템을 중단해야 한다.
 */
export class Assert {
    static equal<T>(a: T, b: T, message?: string) {
        if (!isEqual(a, b)) {
            throw new LogicException(
                `Assert.equal failed: ${JSON.stringify(a)} !== ${JSON.stringify(b)}, ${message ?? ''}`
            )
        }
    }

    static defined(value: any, message: string) {
        if (!value) {
            throw new LogicException(message)
        }
    }
}

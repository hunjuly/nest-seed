import { isEqual } from 'lodash'
import { LogicException } from './exceptions'

/**
 * Obvious logic errors or other unexpected errors.
 * These should stop the system immediately.
 */
export class Assert {
    static equals<T>(a: T, b: T, message: string) {
        if (!isEqual(a, b)) {
            throw new LogicException(`${JSON.stringify(a)} !== ${JSON.stringify(b)}, ${message}`)
        }
    }

    static defined(value: any, message: string) {
        if (!value) {
            throw new LogicException(message)
        }
    }

    static undefined(value: any, message: string) {
        if (value !== undefined) {
            throw new LogicException(message)
        }
    }

    static notDefined(value: any, message: string) {
        if (value) {
            throw new LogicException(message)
        }
    }

    static truthy(value: any, message: string) {
        if (!value) {
            throw new LogicException(message)
        }
    }

    static falsy(value: any, message: string) {
        if (value) {
            throw new LogicException(message)
        }
    }

    static unique(value: any, message: string) {
        if (1 < value.length) {
            throw new LogicException(message)
        }
    }
}

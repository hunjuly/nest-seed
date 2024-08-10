import { Types } from 'mongoose'
import { ObjectId } from './mongoose.schema'

/**
 * stringToObjectId나 objectIdToString는 함수 내부에서 객체를 생성해서 전달한다.
 * 그런데 아래와 같이 함수를 정의하면 함수 내부에서 생성한 객체를 mongoose에서 제대로 읽지 못하는 문제가 있다.
 * export function stringToObjectId(obj: any): any {}
 *
 * function는 자체적인 this를 가진다.
 * const stringToObjectId = (obj:any)=>{}는 mongoose의 this를 가리킨다.
 * mongoose에서 전달받은 값을 복사하지 않고 또 this.condition에 저장해서 사용하는데 이 과정에서 문제가 되는 것으로 보인다.
 */

export const stringToObjectId = (obj: any): any => {
    if (typeof obj === 'string' && Types.ObjectId.isValid(obj)) {
        return new Types.ObjectId(obj)
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => stringToObjectId(item))
    }

    if (isDataObject(obj)) {
        const result: any = {}

        for (const [key, value] of Object.entries(obj)) {
            result[key] = stringToObjectId(value)
        }

        return result
    }

    return obj
}

export const objectIdToString = (obj: any): any => {
    if (obj instanceof Types.ObjectId) {
        return obj.toString()
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => objectIdToString(item))
    }

    if (isDataObject(obj)) {
        const result: any = {}

        for (const [key, value] of Object.entries(obj)) {
            result[key] = objectIdToString(value)
        }

        return result
    }

    return obj
}

function isDataObject(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const proto = Object.getPrototypeOf(value)

    // Plain object or object created with Object.create(null)
    if (proto === null || proto === Object.prototype) {
        return true
    }

    // Check for DTO class instance
    // Consider it a DTO if Object.prototype is in its prototype chain
    // and it has no own methods other than constructor, valueOf, and toString
    return (
        Object.prototype.isPrototypeOf(value) &&
        Object.getOwnPropertyNames(proto).every((prop) =>
            ['constructor', 'valueOf', 'toString'].includes(prop)
        )
    )
}

export function newObjectId() {
    return new ObjectId().toString()
}

export function objectId(id: string) {
    return new ObjectId(id)
}

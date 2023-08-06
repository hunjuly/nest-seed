import { compare, hash } from 'bcrypt'
import { LogicException } from '../exceptions'
import { Coordinate } from '../types'

export async function sleep(timeoutInMS: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeoutInMS))
}

export function generateUUID() {
    // Public Domain/MIT
    let d = new Date().getTime() //Timestamp
    let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0 //Time in microseconds since page-load or 0 if unsupported

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 //random number between 0 and 16

        if (d > 0) {
            //Use timestamp until depleted
            r = (d + r) % 16 | 0
            d = Math.floor(d / 16)
        } else {
            //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0
            d2 = Math.floor(d2 / 16)
        }

        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

export function updateIntersection<T extends object>(obj1: T, obj2: any): T {
    const updatedObject = Object.keys(obj2).reduce(
        (updated, key) => {
            if (key in updated) {
                updated[key as keyof T] = obj2[key]
            }
            return updated
        },
        { ...obj1 } // obj1의 사본을 만듭니다
    )

    return updatedObject
}

export function convertTimeToSeconds(timeString: string): number {
    const matches = timeString.match(/(\d+)\s*(s|m|h|d)?/g)

    if (!matches) {
        throw new Error('Invalid time string')
    }

    const times = matches.map((match) => {
        const [_, value, unit] = match.match(/(\d+)\s*(s|m|h|d)?/) as any
        let multiplier = 1

        switch (unit) {
            case 's':
                multiplier = 1
                break
            case 'm':
                multiplier = 60
                break
            case 'h':
                multiplier = 3600
                break
            case 'd':
                multiplier = 86400
                break
            // 이건 mock이나 spy로 테스트하기 어려워서 무시합니다.
            /* istanbul ignore next */
            default:
                throw new LogicException("Invalid time unit. It should be one of 's', 'm', 'h', 'd'")
        }

        return parseInt(value) * multiplier
    })

    return times.reduce((prev, curr) => prev + curr, 0)
}

export function notUsed(_message?: string) {}

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10

    const hashedPassword = await hash(password, saltRounds)
    return hashedPassword
}

export async function validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return compare(plainPassword, hashedPassword)
}

/**
 * 숫자 값을 따옴표로 감싸는 함수
 * 64bit 정수가 json으로 오면 BigInt가 아니라 number로 처리하기 때문에 정확한 값을 얻을 수 없다.
 * 따라서 숫자 값을 따옴표로 감싸서 string으로 처리해야 한다.
 *
 * addQuotesToNumbers('{"id":1234}') // '{"id":"1234"}'
 * addQuotesToNumbers('[{"id":1234}]') // '[{"id":"1234"}]'
 */
export function addQuotesToNumbers(text: string) {
    return text.replace(/:(\s*)(\d+)(\s*[,\}])/g, ':"$2"$3')
}

export function coordinateDistanceInMeters(coord1: Coordinate, coord2: Coordinate) {
    const toRad = (degree: number) => degree * (Math.PI / 180)
    const R = 6371000 // earth radius in meters

    const lat1 = toRad(coord1.latitude)
    const lon1 = toRad(coord1.longitude)
    const lat2 = toRad(coord2.latitude)
    const lon2 = toRad(coord2.longitude)

    const dLat = lat2 - lat1
    const dLon = lon2 - lon1

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // distance in meters
}

export function equalsIgnoreCase(str1: any, str2: any): boolean {
    if (typeof str1 === 'string' && typeof str2 === 'string') {
        return str1.toLowerCase() === str2.toLowerCase()
    }

    return false
}

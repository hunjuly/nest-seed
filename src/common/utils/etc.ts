import { compare, hash } from 'bcrypt'
import { Coordinate, InvalidArgumentException } from 'common'
import { randomUUID } from 'crypto'

export async function sleep(timeoutInMS: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeoutInMS))
}

export function generateUUID() {
    return randomUUID()
}

export const nullUUID = '00000000000000000000000000000000'
export const nullObjectId = '000000000000000000000000'

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

export function convertStringToMillis(str: string): number {
    const timeUnits: { [key: string]: number } = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    }

    // 유효한 시간 형식인지 검사하는 정규 표현식
    const validFormatRegex = /^(-?\d+(\.\d+)?)(ms|s|m|h|d)(\s*(-?\d+(\.\d+)?)(ms|s|m|h|d))*$/
    if (!validFormatRegex.test(str)) {
        throw new InvalidArgumentException(`Invalid time format(${str})`)
    }

    const regex = /(-?\d+(\.\d+)?)(ms|s|m|h|d)/g
    let totalMillis = 0

    let match
    while ((match = regex.exec(str)) !== null) {
        const amount = parseFloat(match[1])
        const unit = match[3]

        totalMillis += amount * timeUnits[unit]
    }

    return totalMillis
}

export function convertMillisToString(ms: number): string {
    if (ms === 0) {
        return '0ms'
    }

    const negative = ms < 0
    ms = Math.abs(ms)

    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    ms %= 24 * 60 * 60 * 1000
    const hours = Math.floor(ms / (60 * 60 * 1000))
    ms %= 60 * 60 * 1000
    const minutes = Math.floor(ms / (60 * 1000))
    ms %= 60 * 1000
    const seconds = Math.floor(ms / 1000)
    const milliseconds = ms % 1000

    let result = ''
    if (days > 0) result += `${days}d`
    if (hours > 0) result += `${hours}h`
    if (minutes > 0) result += `${minutes}m`
    if (seconds > 0) result += `${seconds}s`
    if (milliseconds > 0) result += `${milliseconds}ms`

    return (negative ? '-' : '') + result.trim()
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

export function notUsed(..._args: any[]) {}
export function comment(..._args: any[]) {}

export class Password {
    static async hash(password: string): Promise<string> {
        const saltRounds = 10

        const hashedPassword = await hash(password, saltRounds)
        return hashedPassword
    }

    static validate(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return compare(plainPassword, hashedPassword)
    }
}

export function padNumber(num: number, length: number): string {
    const paddedNumber = num.toString().padStart(length, '0')

    return paddedNumber
}

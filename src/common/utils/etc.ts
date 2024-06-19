import { Logger } from '@nestjs/common'
import { compare, hash } from 'bcrypt'
import { Queue } from 'bull'
import { Coordinates } from 'common'
import { randomUUID } from 'crypto'

export async function sleep(timeoutInMS: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeoutInMS))
}

export function generateUUID() {
    return randomUUID()
}

export const nullUUID = '00000000000000000000000000000000'
export const nullObjectId = '000000000000000000000000'

/**
 * Functions that wrap numeric values in quotes
 * When a 64-bit integer comes in json, you can't get the exact value because it is treated as a number, not a BigInt.
 * Therefore, we need to wrap the numeric value in quotes and treat it as a string.
 *
 * addQuotesToNumbers('{"id":1234}') -> '{"id":"1234"}'
 * addQuotesToNumbers('[{"id":1234}]') -> '[{"id":"1234"}]'
 */
export function addQuotesToNumbers(text: string) {
    return text.replace(/:(\s*)(\d+)(\s*[,\}])/g, ':"$2"$3')
}

export function coordinatesDistanceInMeters(coord1: Coordinates, coord2: Coordinates) {
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

/**
 * When received as JSON, Date is a string. Convert it to a Date automatically.
 * Add any other types to this function that need to be converted automatically besides Date.
 */
export function transformObjectStrings(obj: any) {
    for (const key in obj) {
        if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj[key])) {
            obj[key] = new Date(obj[key])
        } else if (typeof obj[key] === 'object') {
            transformObjectStrings(obj[key])
        }
    }
}

export async function waitForQueueToEmpty(queue: Queue, count: number = 60): Promise<boolean> {
    for (let i = 0; i < count * 10; i++) {
        const [activeCount, waitingCount] = await Promise.all([
            queue.getActiveCount(),
            queue.getWaitingCount()
        ])

        if (activeCount === 0 && waitingCount === 0) {
            return true
        }

        await sleep(100)
    }

    return false
}

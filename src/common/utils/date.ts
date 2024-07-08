import { UserException } from 'common'

export function stringToMillisecs(str: string): number {
    const timeUnits: { [key: string]: number } = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    }

    // Regular expressions to check for valid time formats
    const validFormatRegex = /^(-?\d+(\.\d+)?)(ms|s|m|h|d)(\s*(-?\d+(\.\d+)?)(ms|s|m|h|d))*$/

    if (!validFormatRegex.test(str)) {
        throw new UserException(`Invalid time format(${str})`)
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

export function millisecsToString(ms: number): string {
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

export function addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000)
}

export function findMinDate(dates: Date[]): Date {
    const minTimestamp = Math.min(...dates.map((date) => date.getTime()))
    return new Date(minTimestamp)
}

export function findMaxDate(dates: Date[]): Date {
    const maxTimestamp = Math.max(...dates.map((date) => date.getTime()))
    return new Date(maxTimestamp)
}

export function convertNumberToDate(dateNumber: number): Date {
    const year = Math.floor(dateNumber / 10000)
    const month = Math.floor((dateNumber % 10000) / 100) - 1 // 월은 0-11로 표현되므로 1을 빼줍니다.
    const day = dateNumber % 100

    return new Date(year, month, day)
}

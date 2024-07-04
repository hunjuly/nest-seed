import { memoize } from 'lodash'

export function stringifyWithSortedKeys(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort()
                .reduce(
                    (result, key) => {
                        result[key] = value[key]
                        return result
                    },
                    {} as Record<string, any>
                )
        }
        return value
    })
}

const memoizedStringify = memoize(stringifyWithSortedKeys)

export function sortDtos(dtos: any[]): any[] {
    return [...dtos].sort((a, b) => {
        const { id: _aId, ...aRest } = a
        const { id: _bId, ...bRest } = b
        return memoizedStringify(aRest).localeCompare(memoizedStringify(bRest))
    })
}

export function expectEqualDtos(actual: any[] | undefined, expected: any[] | undefined) {
    if (!actual || !expected) fail('actual or expected undefined')

    const sortedActual = sortDtos(actual)
    const sortedExpected = sortDtos(expected)

    expect(sortedActual).toEqual(sortedExpected)
}

export function pick<T, K extends keyof T>(items: T[], key: K): T[K][]
export function pick<T, K extends keyof T>(items: T[], keys: K[]): Pick<T, K>[]
export function pick<T, K extends keyof T>(items: T[], keyOrKeys: K | K[]): any {
    if (Array.isArray(keyOrKeys)) {
        return items.map((item) =>
            keyOrKeys.reduce(
                (picked, key) => {
                    picked[key] = item[key]
                    return picked
                },
                {} as Pick<T, K>
            )
        )
    } else {
        return items.map((item) => item[keyOrKeys])
    }
}

export function pickId<T extends { id: string }>(items: T[]): string[] {
    return items.map((item) => item.id)
}

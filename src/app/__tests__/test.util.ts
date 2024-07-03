import { memoize } from 'lodash'

const memoizedStringify = memoize(stringifyWithSortedKeys)

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

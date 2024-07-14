import { AppEvent } from 'common'
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

type PromiseHandlers = {
    eventNames: string[]
    resolve: (value: unknown) => void
    reject: (value: any) => void
}

export class BatchEventListener {
    private promises = new Map<string, PromiseHandlers>()

    protected handleEvent(event: AppEvent & { batchId: string }): void {
        const promise = this.promises.get(event.batchId)

        if (promise) {
            if (promise.eventNames.includes(event.name)) {
                promise.resolve(event)
            } else {
                promise.reject(event)
            }

            this.promises.delete(event.batchId)
        }
    }

    awaitEvent(batchId: string, eventNames: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { eventNames, resolve, reject })
        })
    }
}

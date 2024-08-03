import { AppEvent } from 'common'

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

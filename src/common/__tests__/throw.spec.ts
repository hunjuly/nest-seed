describe('async throw', () => {
    async function throwException() {
        throw new Error('error')
    }

    async function notThrow() {
        return 'ok'
    }

    it('notThrow', async () => {
        const promise = notThrow()

        await expect(promise).resolves.toEqual('ok')
    })

    it('throwException', async () => {
        const promise = throwException()

        await expect(promise).rejects.toThrow(Error)
    })
})

describe('sync throw', () => {
    function throwException() {
        throw new Error('error')
    }

    function notThrow() {
        return 'ok'
    }

    it('notThrow', async () => {
        const callback = () => notThrow()

        expect(callback).not.toThrow()
    })

    it('throwException', async () => {
        const callback = () => throwException()

        expect(callback).toThrow(Error)
    })
})

import * as supertest from 'supertest'

interface TestRequestContext {
    url: string
    headers?: any
    body?: any
    query?: any
}

function transformObjectStrings(obj: any) {
    for (const key in obj) {
        if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj[key])) {
            obj[key] = new Date(obj[key])
        } else if (typeof obj[key] === 'object') {
            transformObjectStrings(obj[key])
        }
    }
}

export class HttpRequest {
    constructor(private readonly server: any) {}

    sendRequest = async (req: supertest.Test, ctx: TestRequestContext) => {
        if (ctx.headers) {
            for (const [key, value] of Object.entries(ctx.headers)) {
                req = req.set(key, value as string)
            }
        }

        const res = await req
        transformObjectStrings(res.body)

        return res
    }

    post = async (ctx: TestRequestContext) => {
        const req = supertest(this.server).post(ctx.url).query(ctx.query).send(ctx.body)

        return this.sendRequest(req, ctx)
    }

    get = async (ctx: TestRequestContext) => {
        if (ctx.body) {
            throw new Error('get은 body를 가지지 않는다')
        }

        const req = supertest(this.server).get(ctx.url).query(ctx.query).send()

        return this.sendRequest(req, ctx)
    }

    patch = async (ctx: TestRequestContext) => {
        const req = supertest(this.server).patch(ctx.url).query(ctx.query).send(ctx.body)

        return this.sendRequest(req, ctx)
    }

    delete = async (ctx: TestRequestContext) => {
        if (ctx.body) {
            throw new Error('delete은 body를 가지지 않는다')
        }

        const req = supertest(this.server).delete(ctx.url).query(ctx.query).send()

        return this.sendRequest(req, ctx)
    }
}

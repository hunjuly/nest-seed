import * as supertest from 'supertest'
import { LogicException } from '../exceptions'

interface RequestContext {
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

    private sendRequest = async (req: supertest.Test, ctx: RequestContext) => {
        if (ctx.headers) {
            for (const [key, value] of Object.entries(ctx.headers)) {
                req = req.set(key, value as string)
            }
        }

        const res = await req
        transformObjectStrings(res.body)

        return res
    }

    async post(ctx: RequestContext) {
        const req = supertest(this.server).post(ctx.url).query(ctx.query).send(ctx.body)

        return this.sendRequest(req, ctx)
    }

    async get(ctx: RequestContext) {
        if (ctx.body) {
            throw new LogicException('get does not have a body')
        }

        const req = supertest(this.server).get(ctx.url).query(ctx.query).send()

        return this.sendRequest(req, ctx)
    }

    async patch(ctx: RequestContext) {
        const req = supertest(this.server).patch(ctx.url).query(ctx.query).send(ctx.body)

        return this.sendRequest(req, ctx)
    }

    async delete(ctx: RequestContext) {
        if (ctx.body) {
            throw new LogicException('delete does not have a body')
        }

        const req = supertest(this.server).delete(ctx.url).query(ctx.query).send()

        return this.sendRequest(req, ctx)
    }
}

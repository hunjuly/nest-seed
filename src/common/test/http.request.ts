import { HttpStatus } from '@nestjs/common'
import * as supertest from 'supertest'
import { LogicException } from '../exceptions'
import { parseObjectTypes } from '../utils'

interface RequestContext {
    url: string
    headers?: any
    body?: any
    query?: any
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
        parseObjectTypes(res.body)

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

function expectHttpStatus(response: supertest.Response, status: HttpStatus) {
    if (response.statusCode !== status) {
        console.log(response.body)
    }

    expect(response.statusCode).toEqual(status)
}

export const expectCreated = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.CREATED)
export const expectOk = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.OK)
export const expectBadRequest = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.BAD_REQUEST)
export const expectUnauthorized = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.UNAUTHORIZED)
export const expectConflict = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.CONFLICT)
export const expectNotFound = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.NOT_FOUND)
export const expectInternalServerError = (res: supertest.Response) =>
    expectHttpStatus(res, HttpStatus.INTERNAL_SERVER_ERROR)

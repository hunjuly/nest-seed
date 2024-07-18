import { HttpStatus } from '@nestjs/common'
import * as supertest from 'supertest'
import { jsonToObject } from '../utils'

interface RequestContext {
    url: string
    headers?: any
    body?: any
    query?: Record<string, any> | string
    fields?: { name: string; value: any }[]
    attachs?: {
        name: string
        file: any
        options?: string | { filename?: string | undefined; contentType?: string | undefined }
    }[]
}

const sendRequest = async (req: supertest.Test, ctx: RequestContext) => {
    ctx.attachs?.forEach((attach) => {
        req.attach(attach.name, attach.file, attach.options)
    })

    ctx.fields?.forEach((field) => {
        req.field(field.name, field.value)
    })

    if (ctx.headers) {
        for (const [key, value] of Object.entries(ctx.headers)) {
            req = req.set(key, value as string)
        }
    }

    if (ctx.query) req.query(ctx.query)
    if (ctx.body) req.send(ctx.body)

    const res = await req
    jsonToObject(res.body)

    return res
}

export class HttpRequest {
    constructor(private readonly server: any) {}
    async post(ctx: RequestContext) {
        return sendRequest(supertest(this.server).post(ctx.url), ctx)
    }

    async patch(ctx: RequestContext) {
        return sendRequest(supertest(this.server).patch(ctx.url), ctx)
    }

    async get(ctx: RequestContext) {
        return sendRequest(supertest(this.server).get(ctx.url), ctx)
    }

    async delete(ctx: RequestContext) {
        return sendRequest(supertest(this.server).delete(ctx.url), ctx)
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
export const expectAccepted = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.ACCEPTED)
export const expectBadRequest = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.BAD_REQUEST)
export const expectUnauthorized = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.UNAUTHORIZED)
export const expectConflict = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.CONFLICT)
export const expectNotFound = (res: supertest.Response) => expectHttpStatus(res, HttpStatus.NOT_FOUND)
export const expectInternalServerError = (res: supertest.Response) =>
    expectHttpStatus(res, HttpStatus.INTERNAL_SERVER_ERROR)

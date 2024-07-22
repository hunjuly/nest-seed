import { HttpStatus } from '@nestjs/common'
import * as supertest from 'supertest'
import { jsonToObject } from '../utils'

export class HttpRequest {
    private req: any

    constructor(private server: any) {}

    post(url: string): this {
        this.req = supertest(this.server).post(url)
        return this
    }

    patch(url: string): this {
        this.req = supertest(this.server).patch(url)
        return this
    }

    get(url: string): this {
        this.req = supertest(this.server).get(url)
        return this
    }

    delete(url: string): this {
        this.req = supertest(this.server).delete(url)
        return this
    }

    query(query: Record<string, any>): this {
        this.req = this.req.query(query)
        return this
    }

    headers(headers: Record<string, string>): this {
        Object.entries(headers).forEach(([key, value]) => {
            this.req = this.req.set(key, value)
        })
        return this
    }

    body(body: Record<string, any>): this {
        this.req = this.req.send(body)
        return this
    }

    attachs(
        attachs: Array<{
            name: string
            file: string | Buffer
            options?: string | { filename?: string; contentType?: string }
        }>
    ): this {
        attachs.forEach(({ name, file, options }) => {
            this.req = this.req.attach(name, file, options)
        })
        return this
    }

    fields(fields: Array<{ name: string; value: string }>): this {
        fields.forEach(({ name, value }) => {
            this.req = this.req.field(name, value)
        })
        return this
    }

    async send(status: HttpStatus): Promise<supertest.Test> {
        const res = await this.req
        if (res.status !== status) {
            console.log(res.body)
        }
        expect(res.status).toEqual(status)
        res.body = jsonToObject(res.body)
        return res
    }
    created() {
        return this.send(HttpStatus.CREATED)
    }
    ok() {
        return this.send(HttpStatus.OK)
    }
    accepted() {
        return this.send(HttpStatus.ACCEPTED)
    }
    badRequest() {
        return this.send(HttpStatus.BAD_REQUEST)
    }
    unauthorized() {
        return this.send(HttpStatus.UNAUTHORIZED)
    }
    conflict() {
        return this.send(HttpStatus.CONFLICT)
    }
    notFound() {
        return this.send(HttpStatus.NOT_FOUND)
    }
    payloadTooLarge() {
        return this.send(HttpStatus.PAYLOAD_TOO_LARGE)
    }
    internalServerError() {
        return this.send(HttpStatus.INTERNAL_SERVER_ERROR)
    }
}

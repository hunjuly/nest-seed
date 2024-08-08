import { HttpStatus } from '@nestjs/common'
import { createWriteStream } from 'fs'
import { posix } from 'path'
import * as supertest from 'supertest'
import { jsonToObject } from '../utils'

export class HttpClient {
    private client: supertest.Test

    constructor(
        private server: any,
        private prefix: string
    ) {}

    private makeUrl(url: string) {
        return posix.join(this.prefix, url)
    }

    post(url: string = ''): this {
        this.client = supertest(this.server).post(this.makeUrl(url))
        return this
    }

    patch(url: string = ''): this {
        this.client = supertest(this.server).patch(this.makeUrl(url))
        return this
    }

    get(url: string = ''): this {
        this.client = supertest(this.server).get(this.makeUrl(url))
        return this
    }

    delete(url: string = ''): this {
        this.client = supertest(this.server).delete(this.makeUrl(url))
        return this
    }

    query(query: Record<string, any>): this {
        this.client = this.client.query(query)
        return this
    }

    headers(headers: Record<string, string>): this {
        Object.entries(headers).forEach(([key, value]) => {
            this.client = this.client.set(key, value)
        })
        return this
    }

    body(body: Record<string, any>): this {
        this.client = this.client.send(body)
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
            this.client = this.client.attach(name, file, options)
        })
        return this
    }

    fields(fields: Array<{ name: string; value: string }>): this {
        fields.forEach(({ name, value }) => {
            this.client = this.client.field(name, value)
        })
        return this
    }

    download(downloadFilePath: string): this {
        const writeStream = createWriteStream(downloadFilePath)

        this.client.buffer().parse((res, callback) => {
            res.on('data', (chunk: any) => {
                writeStream.write(chunk)
            })
            res.on('end', () => {
                writeStream.end()
                callback(null, '')
            })
        })

        return this
    }

    async send(status: HttpStatus): Promise<supertest.Test> {
        const res = await this.client
        if (res.status !== status) {
            console.log(res.body)
        }
        expect(res.status).toEqual(status)
        res.body = jsonToObject(res.body)
        return res
    }
    created = () => this.send(HttpStatus.CREATED)
    ok = () => this.send(HttpStatus.OK)
    accepted = () => this.send(HttpStatus.ACCEPTED)
    badRequest = () => this.send(HttpStatus.BAD_REQUEST)
    unauthorized = () => this.send(HttpStatus.UNAUTHORIZED)
    conflict = () => this.send(HttpStatus.CONFLICT)
    notFound = () => this.send(HttpStatus.NOT_FOUND)
    payloadTooLarge = () => this.send(HttpStatus.PAYLOAD_TOO_LARGE)
    internalServerError = () => this.send(HttpStatus.INTERNAL_SERVER_ERROR)
}

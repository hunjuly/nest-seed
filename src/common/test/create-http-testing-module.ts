import { HttpStatus } from '@nestjs/common'
import * as express from 'express'
import * as supertest from 'supertest'
import { AppLoggerService } from '../logger'
import { Path } from '../utils'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'

interface TestRequestContext {
    url: string
    headers?: any
    body?: any
    query?: any
    status?: HttpStatus
}

export async function createHttpTestingModule(metadata: ModuleMetadataEx) {
    const module = await createTestingModule(metadata)

    const app = module.createNestApplication()

    const loggingDuringTesting = Path.isExistsSync('config/@DEV_LOGGING_DURING_TESTING')

    if (loggingDuringTesting) {
        try {
            const logger = app.get(AppLoggerService)
            app.useLogger(logger)
        } catch (error) {
            app.useLogger(console)
        }
    }

    if (process.env.HTTP_REQUEST_PAYLOAD_LIMIT) {
        const limit = process.env.HTTP_REQUEST_PAYLOAD_LIMIT

        app.use(express.json({ limit }))
        app.use(express.urlencoded({ limit, extended: true }))
    }

    await app.init()

    const server = app.getHttpServer()

    const sendRequest = async (req: supertest.Test, ctx: TestRequestContext) => {
        if (ctx.headers) {
            for (const [key, value] of Object.entries(ctx.headers)) {
                req = req.set(key, value as string)
            }
        }

        const res = await req

        if (ctx.status) {
            if (res.statusCode !== ctx.status) console.log(res.body)

            expect(res.statusCode).toEqual(ctx.status)
        }

        return res
    }

    const post = async (ctx: TestRequestContext) => {
        const req = supertest(server).post(ctx.url).query(ctx.query).send(ctx.body)

        return sendRequest(req, ctx)
    }

    const get = async (ctx: TestRequestContext) => {
        if (ctx.body) {
            throw new Error('get은 body를 가지지 않는다')
        }

        const req = supertest(server).get(ctx.url).query(ctx.query).send()

        return sendRequest(req, ctx)
    }

    const patch = async (ctx: TestRequestContext) => {
        const req = supertest(server).patch(ctx.url).query(ctx.query).send(ctx.body)

        return sendRequest(req, ctx)
    }

    const delete_ = async (ctx: TestRequestContext) => {
        if (ctx.body) {
            throw new Error('delete은 body를 가지지 않는다')
        }

        const req = supertest(server).delete(ctx.url).query(ctx.query).send()

        return sendRequest(req, ctx)
    }

    return { module, app, request: { post, get, patch, delete: delete_ } }
}

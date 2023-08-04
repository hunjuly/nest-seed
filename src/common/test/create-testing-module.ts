import { CanActivate, ExecutionContext, HttpStatus, ModuleMetadata } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as express from 'express'
import * as supertest from 'supertest'
import { AppLoggerService } from '../logger'
import { Path } from '../utils'

interface TestRequestContext {
    url: string
    headers?: any
    body?: any
    query?: any
    status?: HttpStatus
}

interface ModuleMetadataEx extends ModuleMetadata {
    bypassGuards?: any[]
}

class NullGuard implements CanActivate {
    canActivate(_context: ExecutionContext) {
        return true
    }
}

export async function createTestModule(metadata: ModuleMetadataEx) {
    const { bypassGuards, ...moduleConfig } = metadata
    const builder = Test.createTestingModule(moduleConfig)

    if (bypassGuards) {
        for (const guard of bypassGuards) {
            builder.overrideGuard(guard).useClass(NullGuard)
        }
    }

    const module = await builder.compile()

    return module
}

export async function createHttpTestModule(metadata: ModuleMetadataEx) {
    const module = await createTestModule(metadata)

    const app = module.createNestApplication()

    const isTestLoggingEnabled = Path.isExistsSync('@DEV_ENABLE_TEST_LOGGING')

    if (isTestLoggingEnabled) {
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

import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppLoggerService } from 'common'
import * as express from 'express'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { HttpClient } from './http.client'

export interface HttpTestContext {
    server: any
    module: TestingModule
    app: INestApplication<any>
    // TODO to client
    createClient: (prefix?: string) => HttpClient
    close: () => Promise<void>
}

export async function createHttpTestContext(metadata: ModuleMetadataEx): Promise<HttpTestContext> {
    const module = await createTestingModule(metadata)

    const app = module.createNestApplication()

    const ignoreLogging = process.env.IGNORE_LOGGING_DURING_TESTING === 'true'

    if (ignoreLogging) {
        app.useLogger(false)
    } else {
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

    await new Promise<void>((resolve) => {
        server.listen(() => {
            resolve()
        })
    })

    const createClient = (prefix: string = '') => new HttpClient(server, prefix)

    const close = async () => {
        if (server) await server.close()
        if (module) await module.close()
    }

    return { server, module, app, createClient, close }
}

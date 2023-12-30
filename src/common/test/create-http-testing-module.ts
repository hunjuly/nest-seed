import { AppLoggerService } from 'common'
import * as express from 'express'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { HttpRequest } from './http.request'
import { TestingModule } from '@nestjs/testing'

export interface HttpTestEnv {
    server: any
    module: TestingModule
    app: any
    request: HttpRequest
    close: () => Promise<void>
}

export async function createHttpTestEnv(metadata: ModuleMetadataEx): Promise<HttpTestEnv> {
    const module = await createTestingModule(metadata)

    const app = module.createNestApplication()

    const loggingDuringTesting = process.env.DEV_LOGGING_DURING_TESTING === 'true'

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

    await new Promise<void>((resolve) => {
        server.listen(() => {
            resolve()
        })
    })

    const request = new HttpRequest(server)

    const close = async () => {
        if (server) await server.close()
        if (module) await module.close()
    }

    return { server, module, app, request, close }
}

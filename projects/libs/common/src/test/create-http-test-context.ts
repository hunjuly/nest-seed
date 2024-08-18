import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppLoggerService } from '../logger'
import * as express from 'express'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { HttpClient } from './http.client'
import { addAppLogger } from './utils'

export interface HttpTestContext {
    server: any
    module: TestingModule
    app: INestApplication<any>
    client: HttpClient
    close: () => Promise<void>
}

export async function createHttpTestContext(metadata: ModuleMetadataEx): Promise<HttpTestContext> {
    const module = await createTestingModule(metadata)

    const app = module.createNestApplication()
    addAppLogger(app)

    if (process.env.HTTP_REQUEST_PAYLOAD_LIMIT) {
        const limit = process.env.HTTP_REQUEST_PAYLOAD_LIMIT

        app.use(express.json({ limit }))
        app.use(express.urlencoded({ limit, extended: true }))
    }

    await app.init()

    const server = app.getHttpServer()

    await new Promise<void>((resolve) => server.listen(() => resolve()))

    const client = new HttpClient(server)

    const close = async () => {
        await server.close()
        await module.close()
    }

    return { server, module, app, client, close }
}
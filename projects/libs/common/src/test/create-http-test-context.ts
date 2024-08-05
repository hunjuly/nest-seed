import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppLoggerService } from 'common'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { HttpRequest } from './http.request'

export interface HttpTestContext {
    server: any
    module: TestingModule
    app: INestApplication<any>
    createRequest: (prefix?: string) => HttpRequest
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

    // TODO 아니 이걸 여기에 왜 했지?
    // if (process.env.HTTP_REQUEST_PAYLOAD_LIMIT) {
    //     const limit = process.env.HTTP_REQUEST_PAYLOAD_LIMIT

    //     app.use(express.json({ limit }))
    //     app.use(express.urlencoded({ limit, extended: true }))
    // }

    await app.init()

    const server = app.getHttpServer()

    // TODO 이거 await 안 되나? 될거 같은데?
    await new Promise<void>((resolve) => {
        server.listen(() => {
            resolve()
        })
    })

    const createRequest = (prefix: string = '') => new HttpRequest(server, prefix)

    const close = async () => {
        if (server) await server.close()
        if (module) await module.close()
    }

    return { server, module, app, createRequest, close }
}

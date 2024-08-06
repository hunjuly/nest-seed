import { HttpStatus, INestMicroservice } from '@nestjs/common'
import { ClientProxy, ClientsModule, MicroserviceOptions, Transport } from '@nestjs/microservices'
import { TestingModule } from '@nestjs/testing'
import { lastValueFrom } from 'rxjs'
import { AppLoggerService } from '../logger'
import { jsonToObject } from '../utils'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { AllExceptionsFilter } from '../microservice'

export interface MicroserviceTestContext {
    module: TestingModule
    app: INestMicroservice
    client: MicroserviceClient
    close: () => Promise<void>
}

export class MicroserviceClient {
    constructor(private client: ClientProxy) {}

    async send(cmd: string, payload: any) {
        return jsonToObject(await lastValueFrom(this.client.send({ cmd }, payload)))
    }

    async error(cmd: string, payload: any, status: HttpStatus) {
        const res = lastValueFrom(this.client.send({ cmd }, payload))
        await expect(res).rejects.toMatchObject({ status, message: expect.any(String) })
    }
}

export async function createMicroserviceTestContext(
    metadata: ModuleMetadataEx
): Promise<MicroserviceTestContext> {
    const metadataWithTestClient = {
        ...metadata,
        imports: [
            ...(metadata.imports ?? []),
            ClientsModule.register([
                {
                    name: 'TEST_SERVICE',
                    transport: Transport.TCP,
                    options: { host: '0.0.0.0', port: 3000 }
                }
            ])
        ]
    }

    const module = await createTestingModule(metadataWithTestClient)

    const app = module.createNestMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: { host: '0.0.0.0', port: 3000 }
    })

    app.useGlobalFilters(new AllExceptionsFilter())

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

    await app.listen()

    const client = app.get('TEST_SERVICE')
    await client.connect()

    const close = async () => {
        await client.close()
        await app.close()
    }

    return { module, app, close, client: new MicroserviceClient(client) }
}

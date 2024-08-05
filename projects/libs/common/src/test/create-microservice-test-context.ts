import { INestMicroservice } from '@nestjs/common'
import { ClientProxy, ClientsModule, MicroserviceOptions, Transport } from '@nestjs/microservices'
import { TestingModule } from '@nestjs/testing'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { jsonToObject } from '../utils'
import { firstValueFrom } from 'rxjs'

export interface MicroserviceTestContext {
    module: TestingModule
    app: INestMicroservice
    client: MicroserviceClient
    close: () => Promise<void>
}

export class MicroserviceClient {
    constructor(private client: ClientProxy) {}

    async send(cmd: string, payload: any) {
        return jsonToObject(await firstValueFrom(this.client.send({ cmd }, payload)))
    }
}

export async function createMicroserviceTestContext(
    metadata: ModuleMetadataEx
): Promise<MicroserviceTestContext> {
    const module = await createTestingModule({
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
    })

    const app = module.createNestMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: { host: '0.0.0.0', port: 3000 }
    })

    // const ignoreLogging = process.env.IGNORE_LOGGING_DURING_TESTING === 'true'

    // if (ignoreLogging) {
    //     app.useLogger(false)
    // } else {
    //     try {
    //         const logger = app.get(AppLoggerService)
    //         app.useLogger(logger)
    //     } catch (error) {
    //         app.useLogger(console)
    //     }
    // }

    await app.init()
    await app.listen()

    const client = app.get('TEST_SERVICE')
    await client.connect()

    const close = async () => {
        client.close()
        await app.close()
    }

    return { module, app, close, client: new MicroserviceClient(client) }
}

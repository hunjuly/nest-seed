/* istanbul ignore file */

import { INestMicroservice } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { TestingModule } from '@nestjs/testing'
import { HttpToRpcExceptionFilter } from '../microservice'
import { createTestingModule, ModuleMetadataEx } from './create-testing-module'
import { MicroserviceClient } from './microservice.client'
import { addAppLogger, getAvailablePort } from './utils'

export interface MicroserviceTestContext {
    module: TestingModule
    app: INestMicroservice
    client: MicroserviceClient
    close: () => Promise<void>
}

export async function createMicroserviceTestContext(metadata: ModuleMetadataEx) {
    const module = await createTestingModule(metadata)

    const port = await getAvailablePort()
    const rpcOptions = {
        transport: Transport.TCP,
        options: { host: '0.0.0.0', port }
    } as const

    const app = module.createNestMicroservice<MicroserviceOptions>(rpcOptions)
    addAppLogger(app)
    app.useGlobalFilters(new HttpToRpcExceptionFilter())

    await app.listen()

    const client = await MicroserviceClient.create(rpcOptions)

    const close = async () => {
        await client.close()
        await app.close()
    }

    return { module, app, close, client } as MicroserviceTestContext
}

import { INestMicroservice } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { TestingModule } from '@nestjs/testing'
import { AllExceptionsFilter } from '../microservice'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { MicroserviceClient } from './microservice.client'
import { addAppLogger } from './utils'

export interface MicroserviceTestContext {
    module: TestingModule
    app: INestMicroservice
    client: MicroserviceClient
    close: () => Promise<void>
}

export async function createMicroserviceTestContext(
    metadata: ModuleMetadataEx
): Promise<MicroserviceTestContext> {
    const module = await createTestingModule(metadata)

    const rpcOptions = {
        transport: Transport.TCP,
        options: { host: '0.0.0.0', port: 3000 }
    } as const

    const app = module.createNestMicroservice<MicroserviceOptions>(rpcOptions)
    addAppLogger(app)
    app.useGlobalFilters(new AllExceptionsFilter())

    await app.listen()

    const client = await MicroserviceClient.create(rpcOptions)

    const close = async () => {
        await client.close()
        await app.close()
        await module.close()
    }

    return { module, app, close, client }
}

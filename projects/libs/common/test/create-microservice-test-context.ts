import { INestMicroservice } from '@nestjs/common'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { TestingModule } from '@nestjs/testing'
import { AppLoggerService } from 'common'
import { AllExceptionsFilter } from '../microservice'
import { ModuleMetadataEx, createTestingModule } from './create-testing-module'
import { MicroserviceClient } from './microservice.client'

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
    app.useGlobalFilters(new AllExceptionsFilter())

    // Dependent on VSCODE
    const isDebuggingEnabled = process.env.NODE_OPTIONS !== undefined

    if (isDebuggingEnabled) {
        try {
            const logger = app.get(AppLoggerService)
            app.useLogger(logger)
        } catch (error) {
            app.useLogger(console)
        }
    } else {
        app.useLogger(false)
    }

    await app.listen()

    const client = await MicroserviceClient.create(rpcOptions)

    const close = async () => {
        await client.close()
        await module.close()
        await app.close()
    }

    return { module, app, close, client }
}

import { INestMicroservice } from '@nestjs/common'
import {
    ClientProxy,
    ClientProxyFactory,
    MicroserviceOptions,
    Transport
} from '@nestjs/microservices'
import { Test, TestingModule } from '@nestjs/testing'
import { lastValueFrom } from 'rxjs'
import { AllExceptionsFilter } from '../all-exceptions.filter'
import { SampleModule } from './all-exceptions.filter.fixture'

describe('common/filters', () => {
    let client: ClientProxy
    let module: TestingModule
    let app: INestMicroservice

    beforeEach(async () => {
        const builder = Test.createTestingModule({
            imports: [SampleModule]
        })
        module = await builder.compile()

        app = module.createNestMicroservice<MicroserviceOptions>({
            transport: Transport.TCP,
            options: { host: '0.0.0.0', port: 3010 }
        })

        app.useGlobalFilters(new AllExceptionsFilter())
        await app.listen()

        client = ClientProxyFactory.create({
            transport: Transport.TCP,
            options: { host: '0.0.0.0', port: 3010 }
        })

        await client.connect()
    })

    afterEach(async () => {
        await client?.close()
        await app.close()
        await module.close()
    })

    it('HttpExceptionFilter', async () => {
        const res = lastValueFrom(client.send({ cmd: 'getMessage' }, 'payload'))
        await expect(res).resolves.toMatchObject({ status: 404, message: expect.any(String) })
    })
})

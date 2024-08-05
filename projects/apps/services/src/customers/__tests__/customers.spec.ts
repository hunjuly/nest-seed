import { expect } from '@jest/globals'
import {
    createMicroserviceTestContext,
    MicroserviceClient,
    MicroserviceTestContext
} from 'common/test'
import { ServicesModule } from 'services/services.module'

describe('AppController (integration)', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext.close()
    })

    it('should create a customer', async () => {
        const createDto = {
            name: 'name',
            email: 'name@mail.com',
            birthday: new Date('2020-12-12'),
            password: 'password'
        }

        const res = await client.send('createCustomer', createDto)
        const { password: _, ...rest } = createDto
        expect(res).toEqual({ id: expect.anything(), ...rest })
    })
})

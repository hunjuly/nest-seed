import { expect } from '@jest/globals'
import { createMicroserviceTestContext, MicroserviceClient, MicroserviceTestContext } from 'common'
import { ServicesModule } from '../services.module'
import { createCustomer, makeCustomerDto as makeCreateCustomerDto } from './customers.fixture'
import { HttpStatus } from '@nestjs/common'

describe('CustomersModule', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext.close()
    })

    describe('createCustomer', () => {
        it('should create a customer', async () => {
            const { createDto, expectedDto } = makeCreateCustomerDto()
            const customer = await client.send('createCustomer', createDto)

            expect(customer).toEqual(expectedDto)
        })

        it('should return CONFLICT(409) when email already exists', async () => {
            const { createDto } = makeCreateCustomerDto()

            await client.send('createCustomer', createDto)
            await client.error('createCustomer', createDto, HttpStatus.CONFLICT)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            await client.error('createCustomer', {}, HttpStatus.BAD_REQUEST)
        })
    })
})

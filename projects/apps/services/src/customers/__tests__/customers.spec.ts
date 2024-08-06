import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { nullObjectId, OrderDirection } from 'common'
import {
    createMicroserviceTestContext,
    expectEqualUnsorted,
    MicroserviceClient,
    MicroserviceTestContext
} from 'common/test'
import { ServicesModule } from '../../services.module'
import { CustomerDto } from '../dto'
import { createCustomer, createCustomers, makeCustomerDtos } from './customers.fixture'

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
            const { createDto, expectedDto } = makeCustomerDtos()

            const customer = await client.send('createCustomer', createDto)

            expect(customer).toEqual(expectedDto)
        })

        it('should return CONFLICT(409) when email already exists', async () => {
            const { createDto } = makeCustomerDtos()

            await client.send('createCustomer', createDto)
            await client.error('createCustomer', createDto, HttpStatus.CONFLICT)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            await client.error('createCustomer', {}, HttpStatus.BAD_REQUEST)
        })
    })

    describe('updateCustomer', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should update a customer', async () => {
            const customerId = customer.id
            const updateDto = { name: 'update name', email: 'new@mail.com' }

            const updateCustomer = await client.send('updateCustomer', { customerId, updateDto })
            expect(updateCustomer).toEqual({ ...customer, ...updateDto })

            const getCustomer = await client.send('getCustomer', customerId)
            expect(getCustomer).toEqual(updateCustomer)
        })

        it('should return NOT_FOUND(404) when customer does not exist', async () => {
            await client.error(
                'updateCustomer',
                { customerId: nullObjectId, updateDto: {} },
                HttpStatus.NOT_FOUND
            )
        })
    })

    describe('deleteCustomer', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should delete a customer', async () => {
            const customerId = customer.id

            await client.send('deleteCustomer', customerId)
            await client.error('getCustomer', customerId, HttpStatus.NOT_FOUND)
        })

        it('should return NOT_FOUND(404) when customer does not exist', async () => {
            await client.error('deleteCustomer', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('getCustomer', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should get a customer', async () => {
            const getCustomer = await client.send('getCustomer', customer.id)
            expect(getCustomer).toEqual(customer)
        })

        it('should return NOT_FOUND(404) when customer does not exist', async () => {
            await client.error('getCustomer', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('findCustomers', () => {
        let customers: CustomerDto[]

        beforeEach(async () => {
            customers = await createCustomers(client, 20)
        })

        it('should retrieve all customers', async () => {
            const res = await client.send('findCustomers', {
                query: {},
                pagination: { orderby: { name: 'name', direction: OrderDirection.asc } }
            })

            expectEqualUnsorted(res.items, customers)
        })

        it('should retrieve customers by partial name', async () => {
            const partialName = 'Customer-1'
            const res = await client.send('findCustomers', {
                query: { name: partialName }
            })

            const expected = customers.filter((customer) => customer.name.startsWith(partialName))
            expectEqualUnsorted(res.items, expected)
        })
    })

    describe('customersExist', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should return true when customer does exist', async () => {
            const res = await client.send('customersExist', [customer.id])
            expect(res).toBeTruthy()
        })

        it('should return false when customer does not exist', async () => {
            const res = await client.send('customersExist', [nullObjectId])
            expect(res).toBeFalsy()
        })
    })

    describe('authentication', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should return CREATED(201) and AuthTokens on successful login', async () => {
            const getCustomer = await client.send('getCustomerByCredentials', {
                email: 'name@mail.com',
                password: 'password'
            })

            expect(getCustomer).toEqual(customer)

            const loginRes = await client.send('login', {
                customerId: customer.id,
                email: customer.email
            })
            expect(loginRes).toEqual({
                accessToken: expect.anything(),
                refreshToken: expect.anything()
            })

            const refreshRes = await client.send('refreshAuthTokens', loginRes.refreshToken)
            expect(refreshRes).toEqual({
                accessToken: expect.anything(),
                refreshToken: expect.anything()
            })

            expect(loginRes).not.toEqual(refreshRes)
        })
    })
})

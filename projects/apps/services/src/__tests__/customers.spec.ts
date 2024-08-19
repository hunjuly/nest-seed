import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import {
    createMicroserviceTestContext,
    expectEqualUnsorted,
    MicroserviceClient,
    MicroserviceTestContext,
    nullObjectId
} from 'common'
import { CustomerDto } from '../customers'
import { ServicesModule } from '../services.module'
import {
    createCustomer,
    createCustomers,
    makeCustomerDto as makeCreateCustomerDto
} from './customers.fixture'

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

    describe('updateCustomer', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should update a customer', async () => {
            const customerId = customer.id
            const updateDto = {
                name: 'update name',
                email: 'new@mail.com',
                birthdate: new Date('1900-12-31')
            }

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
            await client.send('deleteCustomer', customer.id)
            await client.error('getCustomer', customer.id, HttpStatus.NOT_FOUND)
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
            const gotTheaters = await client.send('getCustomer', customer.id)
            expect(gotTheaters).toEqual(customer)
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

        it('should retrieve customers with default pagination', async () => {
            const { items, ...paginated } = await client.send('findCustomers', {})

            expect(paginated).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: customers.length
            })
            expectEqualUnsorted(items, customers)
        })

        it('should retrieve customers by partial name', async () => {
            const partialName = 'Customer-1'
            const { items } = await client.send('findCustomers', { query: { name: partialName } })

            const expected = customers.filter((customer) => customer.name.startsWith(partialName))
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve customers by partial email', async () => {
            const partialEmail = 'user-1'
            const { items } = await client.send('findCustomers', { query: { email: partialEmail } })

            const expected = customers.filter((customer) => customer.email.startsWith(partialEmail))
            expectEqualUnsorted(items, expected)
        })
    })

    describe('customersExist', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should return true when customer does exist', async () => {
            const exists = await client.send('customersExist', [customer.id])
            expect(exists).toBeTruthy()
        })

        it('should return false when customer does not exist', async () => {
            const exists = await client.send('customersExist', [nullObjectId])
            expect(exists).toBeFalsy()
        })
    })

    describe('authentication', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should return CREATED(201) and AuthTokens on successful login', async () => {
            const gotCustomer = await client.send('getCustomerByCredentials', {
                email: 'name@mail.com',
                password: 'password'
            })
            expect(gotCustomer).toEqual(customer)

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

        it('should return null when incorrect credentials', async () => {
            const getCustomer = await client.send('getCustomerByCredentials', {
                email: 'name@mail.com',
                password: 'wrong password'
            })

            expect(getCustomer).toBeNull()
        })
    })
})

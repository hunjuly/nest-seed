import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { CustomerJwtAuthGuard, CustomerLocalAuthGuard } from 'app/controllers'
import { CustomerDto } from 'app/services/customers'
import { nullObjectId } from 'common'
import {
    HttpClient,
    HttpTestContext,
    createHttpTestContext,
    expectEqualUnsorted
} from 'common/test'
import { createCustomer, createCustomers, makeCustomerDtos } from './customers.fixture'

describe('/customers', () => {
    let testContext: HttpTestContext
    let client: HttpClient

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [AppModule],
            ignoreGuards: [CustomerLocalAuthGuard, CustomerJwtAuthGuard]
        })
        client = testContext.createClient()
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /customers', () => {
        it('should create a customer and return CREATED(201) status', async () => {
            const { createDto, expectedDto } = makeCustomerDtos()

            const { body } = await client.post('/customers').body(createDto).created()

            expect(body).toEqual(expectedDto)
        })

        it('should return CONFLICT(409) when email already exists', async () => {
            const { createDto } = makeCustomerDtos()

            await client.post('/customers').body(createDto).created()
            await client.post('/customers').body(createDto).conflict()
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.post('/customers').body({}).badRequest()
        })
    })

    describe('PATCH /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should update a customer', async () => {
            const updateDto = { name: 'update name', email: 'new@mail.com' }

            const updated = await client.patch(`/customers/${customer.id}`).body(updateDto).ok()
            expect(updated.body).toEqual({ ...customer, ...updateDto })

            const got = await client.get(`/customers/${customer.id}`).ok()
            expect(got.body).toEqual(updated.body)
        })

        it('should return NOT_FOUND(404) when customer does not exist', async () => {
            return client.patch(`/customers/${nullObjectId}`).body({}).notFound()
        })
    })

    describe('DELETE /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should delete a customer', async () => {
            await client.delete(`/customers/${customer.id}`).ok()
            await client.get(`/customers/${customer.id}`).notFound()
        })

        it('should return NOT_FOUND(404) when customer does not exist', async () => {
            return client.delete(`/customers/${nullObjectId}`).notFound()
        })
    })

    describe('GET /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(client)
        })

        it('should get a customer', async () => {
            const res = await client.get(`/customers/${customer.id}`).ok()

            expect(res.body).toEqual(customer)
        })

        it('should return NOT_FOUND(404) when customer does not exist', async () => {
            return client.get(`/customers/${nullObjectId}`).notFound()
        })
    })

    describe('GET /customers', () => {
        let customers: CustomerDto[] = []

        beforeEach(async () => {
            customers = await createCustomers(client)
        })

        it('should retrieve all customers', async () => {
            const { body } = await client.get('/customers').query({ orderby: 'name:asc' }).ok()

            expectEqualUnsorted(body.items, customers)
        })

        it('should retrieve customers by partial name', async () => {
            const partialName = 'Customer-1'
            const { body } = await client.get('/customers').query({ name: partialName }).ok()

            const expected = customers.filter((customer) => customer.name.startsWith(partialName))
            expectEqualUnsorted(body.items, expected)
        })
    })
})

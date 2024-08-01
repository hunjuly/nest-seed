import { expect } from '@jest/globals'
import { CustomerJwtAuthGuard, CustomerLocalAuthGuard, CustomersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { nullObjectId } from 'common'
import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { createCustomer, createCustomers } from './customers.fixture'

describe('/customers', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let customersService: CustomersService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, CustomersModule],
            controllers: [CustomersController],
            ignoreGuards: [CustomerLocalAuthGuard, CustomerJwtAuthGuard]
        })
        req = testContext.createRequest()

        customersService = testContext.module.get(CustomersService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /customers', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        const creationDto = {
            name: 'name',
            email: 'name@mail.com',
            birthday: new Date('2020-12-12'),
            password: 'password'
        }

        it('should create a customer and return CREATED status', async () => {
            const res = await req.post('/customers').body(creationDto).created()

            const { password: _, ...rest } = creationDto
            expect(res.body).toEqual({ id: expect.anything(), ...rest })
        })

        it('CONFLICT(409) if email already exists', async () => {
            return req
                .post('/customers')
                .body({ ...creationDto, email: customer.email })
                .conflict()
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            return req.post('/customers').body({}).badRequest()
        })
    })

    describe('PATCH /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        it('Update a customer', async () => {
            const updateDto = {
                name: 'update name',
                email: 'new@mail.com',
                birthday: new Date('1920-12-12')
            }

            const updateResponse = await req.patch(`/customers/${customer.id}`).body(updateDto).ok()
            expect(updateResponse.body).toEqual({ ...customer, ...updateDto })

            const getResponse = await req.get(`/customers/${customer.id}`).ok()
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            return req.patch(`/customers/${nullObjectId}`).body({}).notFound()
        })
    })

    describe('DELETE /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        it('Delete a customer', async () => {
            await req.delete(`/customers/${customer.id}`).ok()
            await req.get(`/customers/${customer.id}`).notFound()
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            return req.delete(`/customers/${nullObjectId}`).notFound()
        })
    })

    describe('GET /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        it('Retrieve a customer by ID', async () => {
            const res = await req.get(`/customers/${customer.id}`).ok()

            expect(res.body).toEqual(customer)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            return req.get(`/customers/${nullObjectId}`).notFound()
        })
    })

    describe('GET /customers', () => {
        let customers: CustomerDto[] = []

        beforeEach(async () => {
            customers = await createCustomers(customersService, 20)
        })

        it('should retrieve all customers', async () => {
            const res = await req.get('/customers').query({ orderby: 'name:asc' }).ok()

            expect(res.body.items).toEqual(customers)
        })

        it('should retrieve customers by partial name', async () => {
            const partialName = 'Customer-01'
            const res = await req.get('/customers').query({ name: partialName }).ok()

            const expected = customers.filter((customer) => customer.name.startsWith(partialName))
            expect(res.body.items).toEqual(expect.arrayContaining(expected))
            expect(res.body.items.length).toBe(expected.length)
        })
    })
})

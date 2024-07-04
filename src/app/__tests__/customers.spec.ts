import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { CustomersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { nullObjectId } from 'common'
import {
    HttpTestContext,
    createHttpTestContext,
    expectBadRequest,
    expectConflict,
    expectCreated,
    expectNotFound,
    expectOk
} from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createCustomer, createCustomers } from './customers.fixture'

describe('/customers', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let customersService: CustomersService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, CustomersModule],
            controllers: [CustomersController]
        })
        req = testContext.request

        customersService = testContext.module.get(CustomersService)
    })

    afterEach(async () => {
        await testContext.close()
    })

    describe('POST /customers', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        const createDto = {
            name: 'name',
            email: 'name@mail.com',
            birthday: new Date('2020-12-12')
        }

        it('should create a customer and return CREATED status', async () => {
            const res = await req.post({ url: '/customers', body: createDto })
            expectCreated(res)
            expect(res.body).toEqual({ id: expect.anything(), ...createDto })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/customers',
                body: { ...createDto, email: customer.email }
            })
            expectConflict(res)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/customers',
                body: {}
            })
            expectBadRequest(res)
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

            const updateResponse = await req.patch({ url: `/customers/${customer.id}`, body: updateDto })
            expectOk(updateResponse)

            const getResponse = await req.get({ url: `/customers/${customer.id}` })
            expectOk(getResponse)

            expect(updateResponse.body).toEqual({ ...customer, ...updateDto })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            const res = await req.patch({ url: `/customers/${nullObjectId}`, body: {} })
            expectNotFound(res)
        })
    })

    describe('DELETE /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        it('Delete a customer', async () => {
            const deleteResponse = await req.delete({ url: `/customers/${customer.id}` })
            expect(deleteResponse.status).toEqual(HttpStatus.OK)

            const getResponse = await req.get({ url: `/customers/${customer.id}` })
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            const res = await req.delete({ url: `/customers/${nullObjectId}` })
            expectNotFound(res)
        })
    })

    describe('GET /customers', () => {
        let customers: CustomerDto[] = []

        beforeEach(async () => {
            customers = await createCustomers(customersService, 20)
        })

        it('Retrieve all customers', async () => {
            const res = await req.get({
                url: '/customers',
                query: { orderby: 'name:asc' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(customers)
        })

        it('Retrieve customers by partial name', async () => {
            const res = await req.get({
                url: '/customers',
                query: { name: 'Customer-' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(expect.arrayContaining(customers))
        })
    })

    describe('GET /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            customer = await createCustomer(customersService)
        })

        it('Retrieve a customer by ID', async () => {
            const res = await req.get({ url: `/customers/${customer.id}` })
            expectOk(res)
            expect(res.body).toEqual(customer)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/customers/${nullObjectId}` })
            expectNotFound(res)
        })
    })
})

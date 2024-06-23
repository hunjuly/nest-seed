import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { CustomersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createCustomers, sortByName, sortByNameDescending } from './customers.fixture'

describe('CustomersController', () => {
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
        if (testContext) await testContext.close()
    })

    describe('POST /customers', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            const customers = await createCustomers(customersService, 1)
            customer = customers[0]
        })

        const createCustomerDto = {
            name: 'customer name',
            email: 'user@mail.com',
            birthday: new Date('2020-12-12')
        }

        it('should create a customer and return CREATED status', async () => {
            const res = await req.post({ url: '/customers', body: createCustomerDto })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createCustomerDto
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/customers',
                body: { ...createCustomerDto, email: customer.email }
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/customers',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            const customers = await createCustomers(customersService, 1)
            customer = customers[0]
        })

        it('Update a customer', async () => {
            const updateData = {
                name: 'update name',
                email: 'new@mail.com',
                birthday: new Date('1920-12-12')
            }

            const updateResponse = await req.patch({ url: `/customers/${customer.id}`, body: updateData })

            const getResponse = await req.get({ url: `/customers/${customer.id}` })

            expect(updateResponse.status).toEqual(HttpStatus.OK)
            expect(updateResponse.body).toEqual({ ...customer, ...updateData })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            const res = await req.patch({
                url: `/customers/${nullObjectId}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            const customers = await createCustomers(customersService, 1)
            customer = customers[0]
        })

        it('Delete a customer', async () => {
            const deleteResponse = await req.delete({ url: `/customers/${customer.id}` })
            const getResponse = await req.get({ url: `/customers/${customer.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            const res = await req.delete({ url: `/customers/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /customers', () => {
        let customers: CustomerDto[] = []
        // let customer: CustomerDto

        beforeEach(async () => {
            customers = await createCustomers(customersService, 20)
            // customer = customers[0]
        })

        it('Retrieve all customers', async () => {
            const res = await req.get({
                url: '/customers',
                query: { orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(customers)
        })

        // it('Retrieve customers by name', async () => {
        //     const res = await req.get({
        //         url: '/customers',
        //         query: { name: customer.name }
        //     })

        //     expect(res.statusCode).toEqual(HttpStatus.OK)
        //     expect(res.body.items).toEqual([customer])
        // })

        it('Retrieve customers by partial name', async () => {
            const res = await req.get({
                url: '/customers',
                query: { name: 'Customer-' }
            })

            sortByName(res.body.items)
            sortByName(customers)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(customers)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 5

            const res = await req.get({
                url: '/customers',
                query: { skip, take, orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({
                items: customers.slice(skip, skip + take),
                total: customers.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/customers',
                query: { orderby: 'name:asc' }
            })

            sortByName(customers)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(customers)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/customers',
                query: { orderby: 'name:desc' }
            })

            sortByNameDescending(customers)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(customers)
        })
    })

    describe('POST /customers/findByIds', () => {
        let customers: CustomerDto[] = []

        beforeEach(async () => {
            customers = await createCustomers(customersService, 20)
        })

        it('Retrieve customers by multiple IDs', async () => {
            const customerIds = customers.map((customer) => customer.id)

            const res = await req.post({
                url: '/customers/findByIds',
                body: customerIds
            })

            sortByName(res.body)
            sortByName(customers)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(customers)
        })
    })

    describe('GET /customers/:id', () => {
        let customer: CustomerDto

        beforeEach(async () => {
            const customers = await createCustomers(customersService, 1)
            customer = customers[0]
        })

        it('Retrieve a customer by ID', async () => {
            const res = await req.get({ url: `/customers/${customer.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(customer)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/customers/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })
})

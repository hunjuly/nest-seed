import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { CustomerDto } from 'app/services/customers'
import { nullObjectId } from 'common'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'
import {
    createManyCustomers,
    createCustomerDto,
    sortByName,
    sortByNameDescending
} from './customers.controller.fixture'

describe('CustomersController', () => {
    let testingContext: HttpTestingContext
    let req: any

    let customers: CustomerDto[] = []
    let customer: CustomerDto

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        customers = await createManyCustomers(req)
        customer = customers[0]
    })

    afterEach(async () => {
        if (testingContext) {
            await testingContext.close()
        }
    })

    describe('POST /customers', () => {
        it('Create a customer', async () => {
            const res = await req.post({
                url: '/customers',
                body: createCustomerDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createCustomerDto
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res1 = await req.post({ url: '/customers', body: createCustomerDto })
            const res2 = await req.post({ url: '/customers', body: createCustomerDto })

            expect(res1.statusCode).toEqual(HttpStatus.CREATED)
            expect(res2.statusCode).toEqual(HttpStatus.CONFLICT)
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
        it('Update a customer', async () => {
            const updateResponse = await req.patch({
                url: `/customers/${customer.id}`,
                body: { name: 'Updated Customer' }
            })

            const findResponse = await req.get({
                url: `/customers/${customer.id}`
            })

            expect(updateResponse.status).toEqual(HttpStatus.OK)
            expect(updateResponse.body).toEqual({ ...customer, name: 'Updated Customer' })
            expect(updateResponse.body).toEqual(findResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/customers/${customer.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
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
        it('Delete a customer', async () => {
            const res = await req.delete({ url: `/customers/${customer.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
        })

        it('NOT_FOUND(404) if customer is not found', async () => {
            const res = await req.delete({ url: `/customers/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /customers', () => {
        it('Retrieve all customers', async () => {
            const res = await req.get({ url: '/customers', query: { orderby: 'name:asc' } })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({ items: customers, total: customers.length })
        })

        it('Retrieve customers by name', async () => {
            const res = await req.get({ url: '/customers', query: { name: customer.name } })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([customer])
        })

        it('Retrieve customers by partial name', async () => {
            const res = await req.get({ url: '/customers', query: { name: 'Customer-' } })

            sortByName(res.body.items)
            sortByName(customers)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(customers)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50
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

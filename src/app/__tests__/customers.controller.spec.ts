import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { CustomerDto } from 'app/services/customers'
import { nullObjectId } from 'common'
import {
    customerCreationDto,
    createManyCustomers,
    sortCustomers,
    createCustomer
} from './customers.controller.fixture'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'

describe('CustomersController', () => {
    let testingContext: HttpTestingContext
    let req: any

    const setupTestingContext = async () => {
        testingContext = await createHttpTestingContext({
            imports: [AppModule]
        })

        req = testingContext.request
    }

    const teardownTestingContext = async () => {
        if (testingContext) {
            await testingContext.close()
        }
    }

    describe('CustomersController(Creation)', () => {
        beforeEach(setupTestingContext)
        afterEach(teardownTestingContext)

        describe('POST /customers', () => {
            it('Customer 생성', async () => {
                const res = await req.post({
                    url: '/customers',
                    body: customerCreationDto
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidUserDto(customerCreationDto)
            })

            it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
                const res = await req.post({
                    url: '/customers',
                    body: {}
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })
        })
    })

    describe('CustomersController(Modifying)', () => {
        let createdCustomer: CustomerDto

        beforeEach(async () => {
            await setupTestingContext()

            createdCustomer = await createCustomer(req)
        })

        afterEach(teardownTestingContext)

        describe('PATCH /customers/:id', () => {
            it('Customer 업데이트', async () => {
                const res = await req.patch({
                    url: `/customers/${createdCustomer.id}`,
                    body: {
                        name: 'Updated Customer'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...createdCustomer,
                    name: 'Updated Customer'
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/customers/${createdCustomer.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('Customer를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: `/customers/${nullObjectId}`,
                    body: {}
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /customers/:id', () => {
            it('Customer 삭제', async () => {
                const res = await req.delete({
                    url: `/customers/${createdCustomer.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('Customer를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: `/customers/${nullObjectId}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('CustomersController(Querying)', () => {
        let createdCustomers: CustomerDto[] = []

        beforeAll(async () => {
            await setupTestingContext()

            createdCustomers = await createManyCustomers(req)
        })

        afterAll(teardownTestingContext)

        describe('GET /customers', () => {
            it('모든 Customer 조회', async () => {
                const res = await req.get({
                    url: '/customers',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdCustomers,
                    total: createdCustomers.length
                })
            })

            it('name으로 Customer 조회', async () => {
                const targetCustomer = createdCustomers[0]
                const res = await req.get({
                    url: '/customers',
                    query: {
                        name: targetCustomer.name
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetCustomer],
                    total: 1
                })
            })

            it('pagination', async () => {
                const skip = 10
                const take = 50
                const res = await req.get({
                    url: '/customers',
                    query: {
                        skip,
                        take,
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdCustomers.slice(skip, skip + take),
                    total: createdCustomers.length,
                    skip,
                    take
                })
            })

            it('오름차순(asc) 정렬', async () => {
                const res = await req.get({
                    url: '/customers',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdCustomers,
                    total: createdCustomers.length
                })
            })

            it('내림차순(desc) 정렬', async () => {
                const res = await req.get({
                    url: '/customers',
                    query: {
                        orderby: 'name:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: sortCustomers(createdCustomers, 'desc'),
                    total: createdCustomers.length
                })
            })

            it('여러 ID로 Customer 조회', async () => {
                const ids = createdCustomers.map((customer) => customer.id)
                const res = await req.post({
                    url: '/customers/findByIds',
                    body: ids
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortCustomers(res.body)).toEqual(createdCustomers)
            })
        })

        describe('GET /customers/:id', () => {
            it('ID로 Customer 조회', async () => {
                const targetCustomer = createdCustomers[0]
                const res = await req.get({
                    url: `/customers/${targetCustomer.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(targetCustomer)
            })

            it('존재하지 않는 ID로 조회 시 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/customers/' + nullObjectId
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

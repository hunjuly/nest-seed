import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MongolDto } from 'app/services/mongols'
import { nullObjectId } from 'common'
import {
    mongolCreationDto,
    createManyMongols as createManyMongols,
    sortMongols,
    createMongol
} from './mongols.controller.fixture'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'

describe('MongolsController', () => {
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

    describe('MongolsController(Creation)', () => {
        beforeEach(setupTestingContext)
        afterEach(teardownTestingContext)

        describe('POST /mongols', () => {
            it('Mongol 생성', async () => {
                const res = await req.post({
                    url: '/mongols',
                    body: mongolCreationDto
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidUserDto(mongolCreationDto)
            })

            it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
                const res = await req.post({
                    url: '/mongols',
                    body: {}
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })
        })
    })

    describe('MongolsController(Modifying)', () => {
        let createdMongol: MongolDto

        beforeEach(async () => {
            await setupTestingContext()

            createdMongol = await createMongol(req)
        })

        afterEach(teardownTestingContext)

        describe('PATCH /mongols/:id', () => {
            it('Mongol 업데이트', async () => {
                const res = await req.patch({
                    url: `/mongols/${createdMongol.id}`,
                    body: {
                        name: 'Updated Mongol'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...createdMongol,
                    updatedAt: expect.anything(),
                    name: 'Updated Mongol',
                    version: 1
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/mongols/${createdMongol.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('Mongol를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: `/mongols/${nullObjectId}`,
                    body: {}
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /mongols/:id', () => {
            it('Mongol 삭제', async () => {
                const res = await req.delete({
                    url: `/mongols/${createdMongol.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('Mongol를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: `/mongols/${nullObjectId}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('MongolsController(Querying)', () => {
        let createdMongols: MongolDto[] = []

        beforeAll(async () => {
            await setupTestingContext()

            createdMongols = await createManyMongols(req)
        })

        afterAll(teardownTestingContext)

        describe('GET /mongols', () => {
            it('모든 Mongol 조회', async () => {
                const res = await req.get({
                    url: '/mongols',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMongols,
                    total: createdMongols.length
                })
            })

            it('name으로 Mongol 조회', async () => {
                const targetMongol = createdMongols[0]
                const res = await req.get({
                    url: '/mongols',
                    query: {
                        name: targetMongol.name
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetMongol],
                    total: 1
                })
            })

            it('pagination', async () => {
                const skip = 10
                const take = 50
                const res = await req.get({
                    url: '/mongols',
                    query: {
                        skip,
                        take,
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMongols.slice(skip, skip + take),
                    total: createdMongols.length,
                    skip,
                    take
                })
            })

            it('오름차순(asc) 정렬', async () => {
                const res = await req.get({
                    url: '/mongols',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMongols,
                    total: createdMongols.length
                })
            })

            it('내림차순(desc) 정렬', async () => {
                const res = await req.get({
                    url: '/mongols',
                    query: {
                        orderby: 'name:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: sortMongols(createdMongols, 'desc'),
                    total: createdMongols.length
                })
            })

            it('여러 ID로 Mongol 조회', async () => {
                const ids = createdMongols.map((mongol) => mongol.id)
                const res = await req.post({
                    url: '/mongols/findByIds',
                    body: ids
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortMongols(res.body)).toEqual(createdMongols)
            })
        })

        describe('GET /mongols/:id', () => {
            it('ID로 Mongol 조회', async () => {
                const targetMongol = createdMongols[0]
                const res = await req.get({
                    url: `/mongols/${targetMongol.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(targetMongol)
            })

            it('존재하지 않는 ID로 조회 시 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/mongols/' + nullObjectId
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

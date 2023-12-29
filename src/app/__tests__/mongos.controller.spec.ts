import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppModule } from 'app/app.module'
import { MongoDto } from 'app/services/mongos'
import { createHttpTestingModule } from 'common'
import { createMongoDto, generateMongos } from './mocks'

declare module 'expect' {
    interface Matchers<R> {
        toValidMongoDto(expected: any): R
    }
}

describe('MongosController', () => {
    let module: TestingModule
    let request: any
    let server: any

    beforeEach(async () => {
        const sut = await createHttpTestingModule({
            imports: [AppModule]
        })

        module = sut.module
        request = sut.request
        server = sut.server
    })

    afterEach(async () => {
        if (server) await server.close()
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    describe('POST /mongos', () => {
        it('새로운 mongo를 생성한다', async () => {
            const res = await request.post({
                url: '/mongos',
                body: createMongoDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toValidMongoDto(createMongoDto)
        })

        it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
            const res = await request.post({
                url: '/mongos',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('GET /mongos', () => {
        let createdMongos: MongoDto[] = []

        beforeEach(async () => {
            createdMongos = await generateMongos(request)
        })

        it('모든 mongo를 반환한다', async () => {
            const res = await request.get({
                url: '/mongos'
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdMongos)
        })

        it('name으로 mongo를 검색한다', async () => {
            const res = await request.get({
                url: '/mongos',
                query: {
                    name: createdMongos[0].name
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([createdMongos[0]])
        })

        it('pagination', async () => {
            const res = await request.get({
                url: '/mongos',
                query: {
                    name: 'Mongo',
                    skip: 1,
                    take: 2
                }
            })

            const expectedMongs = createdMongos.slice(1, 3)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(expectedMongs)
        })

        it('오름차순(asc) 정렬', async () => {
            const res = await request.get({
                url: '/mongos',
                query: {
                    name: 'Mongo',
                    orderby: 'name:asc'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdMongos)
        })

        it('내림차순(desc) 정렬', async () => {
            const res = await request.get({
                url: '/mongos',
                query: {
                    name: 'Mongo',
                    orderby: 'name:desc'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdMongos.reverse())
        })

        it('id로 mongo를 검색한다', async () => {
            const res = await request.post({
                url: '/mongos/findByIds',
                body: [createdMongos[0].id, createdMongos[1].id]
            })

            const mongoDtos = res.body

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(mongoDtos).toEqual([createdMongos[0], createdMongos[1]])
        })
    })

    describe('특정 mongo에 대한 작업', () => {
        let mongo: MongoDto

        beforeEach(async () => {
            const res = await request.post({
                url: '/mongos',
                body: createMongoDto,
                status: HttpStatus.CREATED
            })

            mongo = res.body
        })

        it('should be defined', () => {
            expect(mongo.id).toBeDefined()
        })

        describe('GET /mongos/:id', () => {
            it('mongo를 반환한다', async () => {
                const res = await request.get({
                    url: `/mongos/${mongo.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(mongo)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.get({
                    url: '/mongos/123456789012345678901234'
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('PATCH /mongos/:id', () => {
            it('mongo를 업데이트한다', async () => {
                const res = await request.patch({
                    url: `/mongos/${mongo.id}`,
                    body: {
                        name: 'Updated Mongo2'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...mongo,
                    updatedAt: expect.anything(),
                    name: 'Updated Mongo2',
                    version: 1
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await request.patch({
                    url: `/mongos/${mongo.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.patch({
                    url: '/mongos/123456789012345678901234',
                    body: {
                        name: 'Updated Mongo'
                    }
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /mongos/:id', () => {
            it('mongo를 삭제한다', async () => {
                const res = await request.delete({
                    url: `/mongos/${mongo.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.delete({
                    url: '/mongos/123456789012345678901234'
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

// it('특정 국가에 있는 문서 찾기', async () => {
//     const sample1 = await repository.create({
//         name: 'sample name 1',
//         address: {
//             street: '123 Main St',
//             city: 'Anytown',
//             country: 'USA'
//         }
//     })

//     const _sample2 = await repository.create({
//         name: 'sample name 2',
//         address: {
//             street: '456 Main St',
//             city: 'Othertown',
//             country: 'Korea'
//         }
//     })

//     const sample3 = await repository.create({
//         name: 'sample name 3',
//         address: {
//             street: '456 Main St',
//             city: 'Othertown',
//             country: 'USA'
//         }
//     })

//     const paginatedResult = await repository.find({
//         middleware: (helpers) => {
//             helpers.setQuery({ 'address.country': 'USA' })
//         }
//     })

//     expect(
//         arePaginatedResultsEqual(paginatedResult, {
//             items: [sample1, sample3],
//             total: 2,
//             skip: undefined,
//             take: undefined
//         })
//     ).toBeTruthy()
// })

import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MongoDto } from 'app/services/mongos'
import { createHttpTestEnv, nullObjectId } from 'common'
import {
    mongoCreationData,
    createManySamples as createManyMongos,
    sortMongos,
    createMongo
} from './mongos.controller.fixture'

describe('MongosController', () => {
    let sut: any
    let req: any

    const before = async () => {
        sut = await createHttpTestEnv({
            imports: [AppModule]
        })

        req = sut.request
    }

    const after = async () => {
        if (sut) await sut.close()
    }

    describe('MongosController(Creation)', () => {
        beforeEach(before)
        afterEach(after)

        describe('POST /mongos', () => {
            it('mongo를 생성', async () => {
                const res = await req.post({
                    url: '/mongos',
                    body: mongoCreationData
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidUserDto(mongoCreationData)
            })

            it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
                const res = await req.post({
                    url: '/mongos',
                    body: {}
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })
        })
    })

    describe('MongosController(Modifying)', () => {
        let mongo: MongoDto

        beforeEach(async () => {
            await before()
            mongo = await createMongo(req)
        })
        afterEach(after)

        describe('PATCH /mongos/:id', () => {
            it('mongo를 업데이트한다', async () => {
                const res = await req.patch({
                    url: `/mongos/${mongo.id}`,
                    body: {
                        name: 'Updated Mongo'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...mongo,
                    updatedAt: expect.anything(),
                    name: 'Updated Mongo',
                    version: 1
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/mongos/${mongo.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: '/mongos/' + nullObjectId,
                    body: {
                        name: 'Updated Mongo'
                    }
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /mongos/:id', () => {
            it('mongo를 삭제한다', async () => {
                const res = await req.delete({
                    url: `/mongos/${mongo.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: '/mongos/' + nullObjectId
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('MongosController(Querying)', () => {
        let createdMongos: MongoDto[] = []

        beforeAll(async () => {
            await before()
            createdMongos = await createManyMongos(req)
        })
        afterAll(after)

        describe('GET /mongos', () => {
            it('모든 mongo를 반환한다', async () => {
                const res = await req.get({
                    url: '/mongos'
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortMongos(res.body.items)).toEqual(createdMongos)
            })

            it('name으로 mongo를 검색한다', async () => {
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        name: createdMongos[0].name
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual([createdMongos[0]])
            })

            it('pagination', async () => {
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        name: 'Mongo',
                        skip: 1,
                        take: 2,
                        orderby: 'name:asc'
                    }
                })

                const expectedMongs = createdMongos.slice(1, 3)

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual(expectedMongs)
            })

            it('오름차순(asc) 정렬', async () => {
                const res = await req.get({
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
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        name: 'Mongo',
                        orderby: 'name:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual(sortMongos(createdMongos, 'desc'))
            })

            it('id로 mongo를 검색한다', async () => {
                const res = await req.post({
                    url: '/mongos/findByIds',
                    body: [createdMongos[0].id, createdMongos[1].id]
                })

                const mongoDtos = res.body

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(mongoDtos).toEqual([createdMongos[0], createdMongos[1]])
            })
        })

        describe('GET /mongos/:id', () => {
            it('mongo를 반환한다', async () => {
                const mongo = createdMongos[0]
                const res = await req.get({
                    url: `/mongos/${mongo.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(mongo)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/mongos/' + nullObjectId
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

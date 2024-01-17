import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MongoDto } from 'app/services/mongos'
import { nullObjectId } from 'common'
import {
    mongoCreationDto,
    createManyMongos as createManyMongos,
    sortMongos,
    createMongo
} from './mongos.controller.fixture'
import { HttpTestEnv, createHttpTestEnv } from 'common/test'

describe('MongosController', () => {
    let sut: HttpTestEnv
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
            it('Mongo 생성', async () => {
                const res = await req.post({
                    url: '/mongos',
                    body: mongoCreationDto
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidUserDto(mongoCreationDto)
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
        let createdMongo: MongoDto

        beforeEach(async () => {
            await before()
            createdMongo = await createMongo(req)
        })
        afterEach(after)

        describe('PATCH /mongos/:id', () => {
            it('Mongo 업데이트', async () => {
                const res = await req.patch({
                    url: `/mongos/${createdMongo.id}`,
                    body: {
                        name: 'Updated Mongo'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...createdMongo,
                    updatedAt: expect.anything(),
                    name: 'Updated Mongo',
                    version: 1
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/mongos/${createdMongo.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('Mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: `/mongos/${nullObjectId}`,
                    body: {}
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /mongos/:id', () => {
            it('Mongo 삭제', async () => {
                const res = await req.delete({
                    url: `/mongos/${createdMongo.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('Mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: `/mongos/${nullObjectId}`
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
            it('모든 Mongo 조회', async () => {
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMongos,
                    total: createdMongos.length
                })
            })

            it('name으로 Mongo 조회', async () => {
                const targetMongo = createdMongos[0]
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        name: targetMongo.name
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetMongo],
                    total: 1
                })
            })

            it('pagination', async () => {
                const skip = 10
                const take = 50
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        skip,
                        take,
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMongos.slice(skip, skip + take),
                    total: createdMongos.length,
                    skip,
                    take
                })
            })

            it('오름차순(asc) 정렬', async () => {
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMongos,
                    total: createdMongos.length
                })
            })

            it('내림차순(desc) 정렬', async () => {
                const res = await req.get({
                    url: '/mongos',
                    query: {
                        orderby: 'name:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: sortMongos(createdMongos, 'desc'),
                    total: createdMongos.length
                })
            })

            it('여러 ID로 Mongo 조회', async () => {
                const ids = createdMongos.map((mongo) => mongo.id)
                const res = await req.post({
                    url: '/mongos/findByIds',
                    body: ids
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortMongos(res.body)).toEqual(createdMongos)
            })
        })

        describe('GET /mongos/:id', () => {
            it('ID로 Mongo 조회', async () => {
                const targetMongo = createdMongos[0]
                const res = await req.get({
                    url: `/mongos/${targetMongo.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(targetMongo)
            })

            it('존재하지 않는 ID로 조회 시 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/mongos/' + nullObjectId
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppModule } from 'app/app.module'
import { MongoDto } from 'app/services/mongos'
import { createHttpTestingModule, defaultUUID } from 'common'
import { createMongoDto, createMongoDtos, createdMongo, createdMongos } from './mocks'

describe('MongosController', () => {
    let module: TestingModule
    let request: any

    beforeEach(async () => {
        const sut = await createHttpTestingModule({
            imports: [AppModule]
        })

        module = sut.module
        request = sut.request
    })

    afterEach(async () => {
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
            expect(res.body).toEqual(createdMongo)
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
        beforeEach(async () => {
            for (const createDto of createMongoDtos) {
                await request.post({
                    url: '/mongos',
                    body: createDto,
                    status: HttpStatus.CREATED
                })
            }
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
                    name: createMongoDtos[0].name
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
                    skip: 0,
                    take: 10,
                    orderby: 'name:desc'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdMongos.reverse())
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
                        name: 'Updated Mongo'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({ ...mongo, name: 'Updated Mongo' })
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

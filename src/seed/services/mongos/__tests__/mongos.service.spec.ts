import { TestingModule } from '@nestjs/testing'
import { createTestingModule } from 'common/test'
import { MongosModule } from '../mongos.module'
import { MongosService } from '../mongos.service'
import { MongoDbModule } from 'seed/modules'
import { createMongoDto, createMongoDtos } from './mocks'
import { LogicException, OrderDirection } from 'common'
import { MongoDto } from '../dto'
import { Mongo } from '../entities'

describe('MongosService', () => {
    let module: TestingModule
    let service: MongosService

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [MongosModule, MongoDbModule]
        })

        service = module.get(MongosService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(service).toBeDefined()
    })

    describe('POST /mongos', () => {
        it('새로운 mongo를 생성한다', async () => {
            const mongo = await service.createMongo(createMongoDto)

            expect(mongo).toBeDefined()
        })
    })

    describe('GET /mongos', () => {
        beforeEach(async () => {
            for (const createDto of createMongoDtos) {
                await service.createMongo(createDto)
            }
        })

        it('모든 mongo를 반환한다', async () => {
            const mongos = await service.findMongos({})

            expect(mongos).toHaveLength(createMongoDtos.length)
            // expect(res.body.items).toEqual(createdMongos)
        })

        it('name으로 mongo를 검색한다', async () => {
            const mongo = await service.findMongos({
                name: createMongoDtos[0].name
            })

            expect(mongo).toBeDefined()
            // expect(res.body.items).toEqual([createdMongos[0]])
        })

        it('pagination', async () => {
            const mongos = await service.findMongos({
                name: 'Mongo',
                skip: 0,
                take: 10,
                orderby: {
                    name: 'name',
                    direction: OrderDirection.desc
                }
            })

            expect(mongos).toHaveLength(createMongoDtos.length)
            // expect(res.body.items).toEqual(createdMongos.reverse())
        })
    })

    describe('특정 mongo에 대한 작업', () => {
        let mongo: MongoDto

        beforeEach(async () => {
            mongo = await service.createMongo(createMongoDto)
        })

        it('should be defined', () => {
            expect(mongo.id).toBeDefined()
        })

        describe('GET /mongos/:id', () => {
            it('mongo를 반환한다', async () => {
                const foundMongo = service.getMongo(mongo.id)

                expect(foundMongo).toEqual(mongo)
            })

            it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
                const promise = service.getMongo('00000000000000000000000000000001')

                await expect(promise).rejects.toThrow(LogicException)
            })
        })

        // describe('PATCH /mongos/:id', () => {
        //     it('mongo를 업데이트한다', async () => {
        //         const res = await request.patch({
        //             url: `/mongos/${mongo.id}`,
        //             body: {
        //                 name: 'Updated Mongo'
        //             }
        //         })

        //         expect(res.status).toEqual(HttpStatus.OK)
        //         // expect(res.body).toEqual({ ...mongo, name: 'Updated Mongo' })
        //     })

        //     it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
        //         const res = await request.patch({
        //             url: `/mongos/${mongo.id}`,
        //             body: {
        //                 wrong_item: 0
        //             }
        //         })

        //         expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
        //     })

        //     it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
        //         const res = await request.patch({
        //             url: `/mongos/${defaultUUID}`,
        //             body: {
        //                 name: 'Updated Mongo'
        //             }
        //         })

        //         // expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        //         expect(res.status).toEqual(HttpStatus.OK)
        //     })
        // })

        // describe('DELETE /mongos/:id', () => {
        //     it('mongo를 삭제한다', async () => {
        //         const res = await request.delete({
        //             url: `/mongos/${mongo.id}`
        //         })

        //         expect(res.status).toEqual(HttpStatus.OK)
        //     })

        //     it('mongo를 찾지 못하면 NOT_FOUND(404)', async () => {
        //         const res = await request.delete({
        //             url: `/mongos/${defaultUUID}`
        //         })

        //         // expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        //         expect(res.status).toEqual(HttpStatus.OK)
        //     })
        // })
    })
})

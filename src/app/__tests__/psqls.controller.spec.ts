import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { PsqlDto } from 'app/services/psqls'
import { createHttpTestEnv, nullUUID } from 'common'
import {
    createManySamples as createManyPsqls,
    createPsql,
    psqlCreationData,
    sortPsqls
} from './psqls.controller.fixture'

describe('PsqlsController', () => {
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

    describe('PsqlsController(Creation)', () => {
        beforeEach(before)
        afterEach(after)

        describe('POST /psqls', () => {
            it('psql를 생성', async () => {
                const res = await req.post({
                    url: '/psqls',
                    body: psqlCreationData
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidPsqlDto(psqlCreationData)
            })

            it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
                const res = await req.post({
                    url: '/psqls',
                    body: {}
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })
        })
    })

    describe('PsqlsController(Modifying)', () => {
        let psql: PsqlDto

        beforeEach(async () => {
            await before()
            psql = await createPsql(req)
        })
        afterEach(after)

        describe('PATCH /psqls/:id', () => {
            it('psql를 업데이트한다', async () => {
                const res = await req.patch({
                    url: `/psqls/${psql.id}`,
                    body: {
                        name: 'Updated Psql'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...psql,
                    updatedAt: expect.anything(),
                    name: 'Updated Psql',
                    version: 2
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/psqls/${psql.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: '/psqls/' + nullUUID,
                    body: {
                        name: 'Updated Psql'
                    }
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /psqls/:id', () => {
            it('psql를 삭제한다', async () => {
                const res = await req.delete({
                    url: `/psqls/${psql.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: '/psqls/' + nullUUID
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('PsqlsController(Querying)', () => {
        let createdPsqls: PsqlDto[] = []

        beforeAll(async () => {
            await before()
            createdPsqls = await createManyPsqls(req)
        })
        afterAll(after)

        describe('GET /psqls', () => {
            it('모든 psql를 반환한다', async () => {
                const res = await req.get({
                    url: '/psqls'
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortPsqls(res.body.items)).toEqual(createdPsqls)
            })

            it('name으로 psql를 검색한다', async () => {
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        name: createdPsqls[0].name
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual([createdPsqls[0]])
            })

            it('pagination', async () => {
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        name: 'Psql',
                        skip: 1,
                        take: 2,
                        orderby: 'name:asc'
                    }
                })

                const expectedMongs = createdPsqls.slice(1, 3)

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual(expectedMongs)
            })

            it('오름차순(asc) 정렬', async () => {
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        name: 'Psql',
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual(createdPsqls)
            })

            it('내림차순(desc) 정렬', async () => {
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        name: 'Psql',
                        orderby: 'name:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body.items).toEqual(sortPsqls(createdPsqls, 'desc'))
            })

            it('id로 psql를 검색한다', async () => {
                const res = await req.post({
                    url: '/psqls/findByIds',
                    body: [createdPsqls[0].id, createdPsqls[1].id]
                })

                const psqlDtos = res.body

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(psqlDtos).toEqual([createdPsqls[0], createdPsqls[1]])
            })
        })

        describe('GET /psqls/:id', () => {
            it('psql를 반환한다', async () => {
                const psql = createdPsqls[0]
                const res = await req.get({
                    url: `/psqls/${psql.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(psql)
            })

            it('psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/psqls/' + nullUUID
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

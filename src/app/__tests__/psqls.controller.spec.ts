import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { PsqlDto } from 'app/services/psqls'
import { nullUUID } from 'common'
import {
    createManyPsqls as createManyPsqls,
    createPsql,
    psqlCreationDto,
    sortPsqls
} from './psqls.controller.fixture'
import { HttpTestEnv, createHttpTestEnv } from 'common/test'

describe('PsqlsController', () => {
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

    describe('PsqlsController(Creation)', () => {
        beforeEach(before)
        afterEach(after)

        describe('POST /psqls', () => {
            it('Psql 생성', async () => {
                const res = await req.post({
                    url: '/psqls',
                    body: psqlCreationDto
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidPsqlDto(psqlCreationDto)
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
        let createdPsql: PsqlDto

        beforeEach(async () => {
            await before()
            createdPsql = await createPsql(req)
        })
        afterEach(after)

        describe('PATCH /psqls/:id', () => {
            it('Psql 업데이트', async () => {
                const res = await req.patch({
                    url: `/psqls/${createdPsql.id}`,
                    body: {
                        name: 'Updated Psql'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...createdPsql,
                    updatedAt: expect.anything(),
                    name: 'Updated Psql',
                    version: 2
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/psqls/${createdPsql.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('Psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: `/psqls/${nullUUID}`,
                    body: {}
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /psqls/:id', () => {
            it('Psql 삭제한다', async () => {
                const res = await req.delete({
                    url: `/psqls/${createdPsql.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('Psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: `/psqls/${nullUUID}`
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
            it('모든 Psql 조회', async () => {
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdPsqls,
                    total: createdPsqls.length
                })
            })

            it('name으로 Psql 조회', async () => {
                const targetPsql = createdPsqls[0]
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        name: targetPsql.name
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetPsql],
                    total: 1
                })
            })

            it('pagination', async () => {
                const skip = 10
                const take = 50
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        name: 'Psql',
                        skip,
                        take,
                        orderby: 'name:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdPsqls.slice(skip, skip + take),
                    total: createdPsqls.length,
                    skip,
                    take
                })
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
                expect(res.body).toEqual({
                    items: createdPsqls,
                    total: createdPsqls.length
                })
            })

            it('내림차순(desc) 정렬', async () => {
                const res = await req.get({
                    url: '/psqls',
                    query: {
                        orderby: 'name:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: sortPsqls(createdPsqls, 'desc'),
                    total: createdPsqls.length
                })
            })

            it('여러 ID로 Psql 조회', async () => {
                const ids = createdPsqls.map((psql) => psql.id)
                const res = await req.post({
                    url: '/psqls/findByIds',
                    body: ids
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortPsqls(res.body)).toEqual(createdPsqls)
            })
        })

        describe('GET /psqls/:id', () => {
            it('ID로 Psql 조회', async () => {
                const targetPsql = createdPsqls[0]
                const res = await req.get({
                    url: `/psqls/${targetPsql.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(targetPsql)
            })

            it('존재하지 않는 ID로 조회 시 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/psqls/' + nullUUID
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

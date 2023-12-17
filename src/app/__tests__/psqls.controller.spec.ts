import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppModule } from 'app/app.module'
import { PsqlDto } from 'app/services/psqls'
import { createHttpTestingModule, defaultUUID } from 'common'
import { createPsqlDto, createPsqlDtos, createdPsql } from './mocks'

describe('PsqlsController', () => {
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

    describe('POST /psqls', () => {
        it('새로운 psql를 생성한다', async () => {
            const res = await request.post({
                url: '/psqls',
                body: createPsqlDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual(createdPsql)
        })

        it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
            const res = await request.post({
                url: '/psqls',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('GET /psqls', () => {
        let createdPsqls: PsqlDto[] = []

        beforeEach(async () => {
            createdPsqls = []

            for (const createDto of createPsqlDtos) {
                const res = await request.post({
                    url: '/psqls',
                    body: createDto,
                    status: HttpStatus.CREATED
                })

                createdPsqls.push(res.body)
            }
        })

        it('모든 psql를 반환한다', async () => {
            const res = await request.get({
                url: '/psqls'
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdPsqls)
        })

        it('name으로 psql를 검색한다', async () => {
            const res = await request.get({
                url: '/psqls',
                query: {
                    name: createPsqlDtos[0].name
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([createdPsqls[0]])
        })

        it('pagination', async () => {
            const res = await request.get({
                url: '/psqls',
                query: {
                    name: 'Psql',
                    skip: 0,
                    take: 10,
                    orderby: 'name:desc'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdPsqls.reverse())
        })
    })

    describe('특정 psql에 대한 작업', () => {
        let psql: PsqlDto

        beforeEach(async () => {
            const res = await request.post({
                url: '/psqls',
                body: createPsqlDto,
                status: HttpStatus.CREATED
            })

            psql = res.body
        })

        it('should be defined', () => {
            expect(psql.id).toBeDefined()
        })

        describe('GET /psqls/:id', () => {
            it('psql를 반환한다', async () => {
                const res = await request.get({
                    url: `/psqls/${psql.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(psql)
            })

            it('psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.get({
                    url: `/psqls/${defaultUUID}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('PATCH /psqls/:id', () => {
            it('psql를 업데이트한다', async () => {
                const res = await request.patch({
                    url: `/psqls/${psql.id}`,
                    body: {
                        name: 'Updated Psql'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({ ...psql, name: 'Updated Psql' })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await request.patch({
                    url: `/psqls/${psql.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.patch({
                    url: `/psqls/${defaultUUID}`,
                    body: {
                        name: 'Updated Psql'
                    }
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /psqls/:id', () => {
            it('psql를 삭제한다', async () => {
                const res = await request.delete({
                    url: `/psqls/${psql.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('psql를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.delete({
                    url: `/psqls/${defaultUUID}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

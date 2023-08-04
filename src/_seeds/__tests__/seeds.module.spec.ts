import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { createHttpTestModule, nullUUID } from 'src/common/test'
import { GlobalModule } from 'src/global'
import { Seed } from '../entities'
import { SeedsModule } from '../seeds.module'
import { createSeedDto, createSeedDtos, createdSeed, createdSeeds } from './seeds.test-utils'

describe('SeedsModule', () => {
    let module: TestingModule
    let request: any

    beforeEach(async () => {
        const sut = await createHttpTestModule({
            imports: [GlobalModule, SeedsModule]
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

    describe('POST /seeds', () => {
        it('새로운 seed를 생성합니다', async () => {
            const res = await request.post({
                url: '/seeds',
                body: createSeedDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toMatchObject(createdSeed)
        })

        it('필수 항목이 누락되었을 때 400(Bad request)을 반환합니다', async () => {
            const res = await request.post({
                url: '/seeds',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('GET /seeds', () => {
        beforeEach(async () => {
            for (const createDto of createSeedDtos) {
                await request.post({
                    url: '/seeds',
                    body: createDto,
                    status: HttpStatus.CREATED
                })
            }
        })

        it('검색으로 seed를 반환합니다', async () => {
            const res = await request.get({
                url: '/seeds',
                query: {
                    name: createSeedDtos[0].name
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toMatchObject([createdSeeds[0]])
        })

        it('기본 옵션으로 seed를 반환합니다', async () => {
            const res = await request.get({
                url: '/seeds'
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toMatchObject(createdSeeds)
        })

        it('pagenation', async () => {
            const res = await request.get({
                url: '/seeds',
                query: {
                    name: 'Seed',
                    skip: 0,
                    take: 10,
                    orderby: 'name:desc'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toMatchObject(createdSeeds.reverse())
        })
    })

    describe('특정 seed에 대한 작업', () => {
        let seed: Seed

        beforeEach(async () => {
            const res = await request.post({
                url: '/seeds',
                body: createSeedDto,
                status: HttpStatus.CREATED
            })

            seed = res.body
        })

        it('seed는 유효해야 한다.', () => {
            expect(seed.id).toBeDefined()
        })

        describe('GET /seeds/:id', () => {
            it('주어진 id로 seed를 반환합니다', async () => {
                const res = await request.get({
                    url: `/seeds/${seed.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toMatchObject(seed)
            })

            it('seed를 찾지 못한 경우 404 에러를 반환합니다', async () => {
                const res = await request.get({
                    url: `/seeds/${nullUUID}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('PATCH /seeds/:id', () => {
            it('주어진 id로 seed를 업데이트합니다', async () => {
                const res = await request.patch({
                    url: `/seeds/${seed.id}`,
                    body: {
                        name: 'Updated Seed'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({ ...seed, name: 'Updated Seed' })
            })

            it('잘못된 업데이트 항목은 400 오류를 반환합니다.', async () => {
                const res = await request.patch({
                    url: `/seeds/${seed.id}`,
                    body: {
                        wrong: '.'
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('seed를 찾지 못한 경우 404 에러를 반환합니다', async () => {
                const res = await request.patch({
                    url: `/seeds/${nullUUID}`,
                    body: {
                        name: 'Updated Seed'
                    }
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /seeds/:id', () => {
            it('주어진 id로 seed를 삭제합니다', async () => {
                const res = await request.delete({
                    url: `/seeds/${seed.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('seed를 찾지 못한 경우 404 에러를 반환합니다', async () => {
                const res = await request.delete({
                    url: `/seeds/${nullUUID}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

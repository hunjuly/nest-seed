import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { TestingModule } from '@nestjs/testing'
import { createHttpTestModule } from '../../test'
import { DEFAULT_TAKE_SIZE } from '../pagination'
import { SamplesModule } from './pagination.fixture'

describe('Pagination', () => {
    let module: TestingModule
    let request: any

    const items_length = 10

    beforeEach(async () => {
        const sut = await createHttpTestModule({
            imports: [SamplesModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useFactory: () =>
                        new ValidationPipe({
                            transform: true,
                            transformOptions: { enableImplicitConversion: true }
                        })
                }
            ]
        })

        module = sut.module
        request = sut.request

        await preconditions()
    })

    const preconditions = async () => {
        for (let i = 0; i < items_length; i++) {
            await request.post({
                url: '/samples',
                body: {
                    name: `Seed#${i}`
                },
                status: HttpStatus.CREATED
            })
        }
    }

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    it('이름 오름차순 정렬', async () => {
        const res = await request.get({
            url: '/samples',
            query: {
                skip: 5,
                orderby: 'name:asc'
            }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.items[0].name).toEqual('Seed#5')
        expect(res.body.items[4].name).toEqual('Seed#9')
    })

    it('이름 내림차순 정렬', async () => {
        const res = await request.get({
            url: '/samples',
            query: {
                skip: 5,
                orderby: 'name:desc'
            }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.items[0].name).toEqual('Seed#4')
        expect(res.body.items[4].name).toEqual('Seed#0')
    })

    it('매개변수가 제공되지 않은 경우 기본 페이징 값으로 아이템 반환', async () => {
        const res = await request.get({
            url: '/samples'
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.total).toEqual(items_length)
        expect(res.body.skip).toEqual(0)
        expect(res.body.take).toBeLessThanOrEqual(DEFAULT_TAKE_SIZE)
        expect(res.body.items.length).toEqual(items_length)
    })

    it('사용자 정의 take와 skip 값으로 아이템 반환', async () => {
        const res = await request.get({
            url: '/samples',
            query: {
                skip: 2,
                take: 3,
                orderby: 'name:asc'
            }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.total).toEqual(items_length)
        expect(res.body.skip).toEqual(2)
        expect(res.body.take).toEqual(3)
        expect(res.body.items.length).toEqual(3)
        expect(res.body.items[0].name).toEqual('Seed#2')
        expect(res.body.items[2].name).toEqual('Seed#4')
    })

    it('orderby 형식이 틀림', async () => {
        const res = await request.get({
            url: '/samples',
            query: {
                orderby: 'wrong'
            }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('order direction이 틀림', async () => {
        const res = await request.get({
            url: '/samples',
            query: {
                orderby: 'name:wrong'
            }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('skip 값이 아이템 총 개수보다 큰 경우 빈 목록 반환', async () => {
        const res = await request.get({
            url: `/samples`,
            query: {
                skip: items_length,
                take: 5,
                orderby: 'name:asc'
            }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.items.length).toEqual(0)
    })

    it('skip 값이 아이템 총 개수보다 큰 경우 올바른 페이징 메타데이터 반환', async () => {
        const res = await request.get({
            url: '/samples',
            query: {
                skip: 15,
                take: 5,
                orderby: 'name:asc'
            }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.total).toEqual(items_length)
        expect(res.body.skip).toEqual(15)
        expect(res.body.take).toEqual(5)
    })
})

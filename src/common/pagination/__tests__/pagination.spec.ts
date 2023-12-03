import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { TestingModule } from '@nestjs/testing'
import { createHttpTestingModule } from 'common'
import { Sample, SamplesModule } from './pagination.fixture'

describe('Pagination', () => {
    let module: TestingModule
    let request: any

    let samples: Sample[] = []

    beforeEach(async () => {
        const sut = await createHttpTestingModule({
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

        await createSamples()
    })

    const createSamples = async () => {
        samples = []

        for (let i = 0; i < 100; i++) {
            // 그냥 1,2,3,4로 하면 orderby 할 때 1,10,2,3 순서로 된다.
            const paddedNumber = i.toString().padStart(3, '0')

            const res = await request.post({
                url: '/samples',
                body: { name: `Sample#${paddedNumber}` },
                status: HttpStatus.CREATED
            })

            samples.push(res.body)
        }
    }

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    it('오름차순 정렬', async () => {
        const res = await request.get({
            url: '/samples',
            query: { orderby: 'name:asc' }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        samples.sort((a, b) => a.name.localeCompare(b.name))
        expect(res.body.items as unknown[]).toEqual(samples)
    })

    it('내림차순 정렬', async () => {
        const res = await request.get({
            url: '/samples',
            query: { orderby: 'name:desc' }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        samples.sort((a, b) => b.name.localeCompare(a.name))
        expect(res.body.items as unknown[]).toEqual(samples)
    })

    it('skip & take 생략하면 전체 아이템 반환', async () => {
        const res = await request.get({
            url: '/samples'
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.total).toEqual(samples.length)
        expect(res.body.items.length).toEqual(samples.length)
    })

    it('skip & take 설정한 만큼 아이템 반환', async () => {
        const skip = 2
        const take = 3

        const res = await request.get({
            url: '/samples',
            query: { skip, take, orderby: 'name:asc' }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.total).toEqual(samples.length)
        expect(res.body).toMatchObject({ skip, take })
        const expectedSamples = samples.slice(skip, skip + take)
        expect(res.body.items).toEqual(expectedSamples)
    })

    it('skip 값이 아이템 총 개수보다 큰 경우 빈 목록 반환', async () => {
        const skip = samples.length
        const take = 5

        const res = await request.get({
            url: '/samples',
            query: { skip, take, orderby: 'name:asc' }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body.total).toEqual(samples.length)
        expect(res.body).toMatchObject({ skip, take })
        expect(res.body.items.length).toEqual(0)
    })

    it('orderby 형식이 틀림', async () => {
        const res = await request.get({
            url: '/samples',
            query: { orderby: 'wrong' }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('order direction이 틀림', async () => {
        const res = await request.get({
            url: '/samples',
            query: { orderby: 'name:wrong' }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })
})

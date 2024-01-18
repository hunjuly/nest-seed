import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { HttpTestEnv, createHttpTestEnv } from 'common/test'
import { SamplesModule } from './pagination.mock'

describe('Pagination', () => {
    let sut: HttpTestEnv
    let req: any

    beforeEach(async () => {
        sut = await createHttpTestEnv({
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

        req = sut.request
    })

    afterEach(async () => {
        if (sut) await sut.close()
    })

    it('Pagination 옵션이 적용되어야 한다', async () => {
        const skip = 2
        const take = 3

        const res = await req.get({
            url: '/samples',
            query: { skip, take, orderby: 'name:asc' }
        })

        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body).toEqual({
            orderby: { direction: 'asc', name: 'name' },
            skip,
            take
        })
    })

    it('orderby 형식이 틀림', async () => {
        const res = await req.get({
            url: '/samples',
            query: { orderby: 'wrong' }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('order direction이 틀림', async () => {
        const res = await req.get({
            url: '/samples',
            query: { orderby: 'name:wrong' }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })
})

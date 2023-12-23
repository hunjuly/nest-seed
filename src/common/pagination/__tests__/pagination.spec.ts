import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { TestingModule } from '@nestjs/testing'
import { createHttpTestingModule } from 'common'
import { SamplesModule } from './pagination.fixture'

describe('Pagination', () => {
    let module: TestingModule
    let request: any

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
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    it('Pagination 옵션이 적용되어야 한다', async () => {
        const skip = 2
        const take = 3

        const res = await request.get({
            url: '/samples',
            query: { skip, take, orderby: 'name:asc' }
        })

        const expected = {
            orderby: { direction: 'asc', name: 'name' },
            skip,
            take
        }
        expect(res.status).toEqual(HttpStatus.OK)
        expect(res.body).toEqual(expected)
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

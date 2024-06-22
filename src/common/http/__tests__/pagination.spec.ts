import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { HttpTestContext, createHttpTestContext, expectBadRequest, expectOk } from 'common/test'
import { SamplesModule } from './pagination.fixture'

describe('Pagination', () => {
    let testContext: HttpTestContext
    let req: any

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [SamplesModule],
            providers: [
                {
                    provide: APP_PIPE,
                    useFactory: () =>
                        new ValidationPipe({
                            whitelist: true,
                            transform: true,
                            transformOptions: { enableImplicitConversion: true }
                        })
                }
            ]
        })

        req = testContext.request
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('should apply pagination options correctly', async () => {
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

    it('should return Bad Request when orderby format is incorrect', async () => {
        const res = await req.get({
            url: '/samples',
            query: { orderby: 'wrong' }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('should return Bad Request when order direction is incorrect', async () => {
        const res = await req.get({
            url: '/samples',
            query: { orderby: 'name:wrong' }
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('Multiple @Query() usage is possible', async () => {
        const skip = 2
        const take = 3

        const res = await req.get({
            url: '/samples/multiple',
            query: { skip, take, name: 'abcd' }
        })

        expectOk(res)
        expect(res.body).toEqual({
            user: { name: 'abcd' },
            pagination: { skip, take }
        })
    })

    it("Should return Bad Request when 'take' exceeds the specified limit", async () => {
        const take = 51

        const res = await req.get({
            url: '/samples/maxsize',
            query: { take }
        })
        expectBadRequest(res)
    })

    it('If ‘take’ is not specified, a default value is used.', async () => {
        const res = await req.get({
            url: '/samples/maxsize',
            query: {}
        })
        expectOk(res)
        expect(res.body).toEqual({ take: 50 })
    })
})

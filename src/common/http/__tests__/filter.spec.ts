import { HttpStatus } from '@nestjs/common'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'
import { TestModule } from './filter.fixture'

describe('common/filters', () => {
    let testingContext: HttpTestingContext
    let req: any

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({
            imports: [TestModule]
        })

        req = testingContext.request
        // error를 console에 출력하지 않도록 설정
        testingContext.app.useLogger(false)
    })

    afterEach(async () => {
        if (testingContext) {
            await testingContext.close()
        }
    })

    it('ErrorFilter', async () => {
        const res = await req.get({
            url: '/error'
        })

        expect(res.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('HttpExceptionFilter', async () => {
        const res = await req.get({
            url: '/http-exception'
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('HttpSuccessInterceptor', async () => {
        const res = await req.get({
            url: '/http-success'
        })

        expect(res.status).toEqual(HttpStatus.OK)
    })
})

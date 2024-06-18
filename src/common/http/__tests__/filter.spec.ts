import { HttpStatus } from '@nestjs/common'
import { HttpTestContext, createHttpTestContext } from 'common/test'
import { TestModule } from './filter.fixture'

describe('common/filters', () => {
    let testContext: HttpTestContext
    let req: any

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [TestModule]
        })

        req = testContext.request
        // Disable outputting errors to the console
        testContext.app.useLogger(false)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('ErrorFilter', async () => {
        const res = await req.get({ url: '/error' })

        expect(res.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('HttpExceptionFilter', async () => {
        const res = await req.get({ url: '/http-exception' })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('HttpSuccessInterceptor', async () => {
        const res = await req.get({ url: '/http-success' })

        expect(res.status).toEqual(HttpStatus.OK)
    })
})

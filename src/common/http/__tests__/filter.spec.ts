import {
    HttpTestContext,
    createHttpTestContext,
    expectBadRequest,
    expectInternalServerError,
    expectOk
} from 'common/test'
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
        await testContext.close()
    })

    it('ErrorFilter', async () => {
        const res = await req.get({ url: '/error' })
        expectInternalServerError(res)
    })

    it('HttpExceptionFilter', async () => {
        const res = await req.get({ url: '/http-exception' })
        expectBadRequest(res)
    })

    it('HttpSuccessInterceptor', async () => {
        const res = await req.get({ url: '/http-success' })
        expectOk(res)
    })
})

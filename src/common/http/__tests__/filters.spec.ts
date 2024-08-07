import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { TestModule } from './filters.fixture'

describe('common/filters', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [TestModule] })
        req = testContext.createRequest()
        testContext.app.useLogger(false)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('ErrorFilter', async () => {
        return req.get('/error').internalServerError()
    })

    it('HttpExceptionFilter', async () => {
        return req.get('/http-exception').badRequest()
    })

    it('HttpSuccessInterceptor', async () => {
        return req.get('/http-success').ok()
    })
})

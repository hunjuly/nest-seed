import { HttpClient, HttpTestContext, createHttpTestContext } from 'common'
import { TestModule } from './filters.fixture'

describe('http/filters', () => {
    let testContext: HttpTestContext
    let client: HttpClient

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [TestModule] })
        client = testContext.client
        testContext.app.useLogger(false)
    })

    afterEach(async () => {
        await testContext.close()
    })

    it('ErrorFilter', async () => {
        return client.get('/error').internalServerError()
    })

    it('HttpExceptionFilter', async () => {
        return client.get('/http-exception').badRequest()
    })

    it('HttpSuccessInterceptor', async () => {
        return client.get('/http-success').ok()
    })
})

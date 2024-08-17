import { HttpClient, HttpTestContext, createHttpTestContext } from 'common'
import { SampleModule, SampleService } from './create-http-test-context.fixture'

describe('createHttpTestContext', () => {
    let testContext: HttpTestContext
    let client: HttpClient

    const serviceMock = {
        getMessage: jest.fn().mockReturnValue({ message: 'This is Mock' })
    }

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [SampleModule],
            overrideProviders: [
                {
                    original: SampleService,
                    replacement: serviceMock
                }
            ]
        })

        client = testContext.client
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('should return mock message', async () => {
        const res = await client.get('/').ok()

        expect(res.body).toEqual({ message: 'This is Mock' })
    })
})

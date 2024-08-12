import { HttpTestContext, createHttpTestContext } from 'common/test'
import { FixtureModule, FixtureService } from './create-http-test-context.fixture'

describe('Service Mocking', () => {
    let testContext: HttpTestContext
    let client: any

    const fixtureServiceMock = {
        getMessage: jest.fn().mockReturnValue({ message: 'This is Mock' })
    }

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [FixtureModule],
            overrideProviders: [
                {
                    original: FixtureService,
                    replacement: fixtureServiceMock
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

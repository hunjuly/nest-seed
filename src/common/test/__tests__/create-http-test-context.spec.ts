import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { FixtureModule, FixtureService } from './create-http-test-context.fixture'

describe('Service Mocking', () => {
    let testContext: HttpTestContext
    let req: any

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

        req = testContext.request
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('should return mock message', async () => {
        const res = await req.get({ url: '/' })
        expectOk(res)
        expect(res.body).toEqual({ message: 'This is Mock' })
    })
})

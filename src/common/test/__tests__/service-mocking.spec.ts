import { HttpTestingContext, createHttpTestingContext, expectOk } from 'common/test'
import { FixtureModule, FixtureService } from './service-mocking.fixture'

describe('Service Mocking', () => {
    let testingContext: HttpTestingContext
    let req: any

    const fixtureServiceMock = {
        getMessage: jest.fn().mockReturnValue({ message: 'This is Mock' })
    }

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({
            imports: [FixtureModule],
            overrideProviders: [
                {
                    original: FixtureService,
                    replacement: fixtureServiceMock
                }
            ]
        })

        req = testingContext.request
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    it('should return mock message', async () => {
        const res = await req.get({ url: '/' })
        expectOk(res)
        expect(res.body).toEqual({ message: 'This is Mock' })
    })
})

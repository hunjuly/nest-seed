import { HttpTestContext, createHttpTestContext, expectBadRequest } from 'common/test'
import { TestModule } from './pipes.fixture'

describe('common/http/pipes', () => {
    let testContext: HttpTestContext
    let req: any

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [TestModule] })
        req = testContext.request
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('LatLongPipe', () => {
        it('should parse valid latlong', async () => {
            const res = await req.get({ url: '/latlong', query: { location: '37.123,128.678' } })
            expect(res.body).toEqual({ latitude: 37.123, longitude: 128.678 })
        })

        it('should throw BadRequestException when latlong is missing', async () => {
            const res = await req.get({ url: '/latlong' })
            expectBadRequest(res)
        })

        it('should throw BadRequestException for invalid format', async () => {
            const res = await req.get({ url: '/latlong', query: { location: '37.123' } })
            expectBadRequest(res)
        })

        it('should throw BadRequestException for out of range values', async () => {
            const res = await req.get({ url: '/latlong', query: { location: '91,181' } })
            expectBadRequest(res)
        })
    })
})

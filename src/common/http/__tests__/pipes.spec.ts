import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { TestModule } from './pipes.fixture'

describe('common/http/pipes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [TestModule] })
        req = testContext.request
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('LatLongPipe', () => {
        it('should parse valid latlong', async () => {
            const res = await req.get('/latlong').query({ location: '37.123,128.678' }).ok()

            expect(res.body).toEqual({ latitude: 37.123, longitude: 128.678 })
        })

        it('should throw BadRequestException when latlong is missing', async () => {
            return req.get('/latlong').badRequest()
        })

        it('should throw BadRequestException for invalid format', async () => {
            return req.get('/latlong').query({ location: '37.123' }).badRequest()
        })

        it('should throw BadRequestException for out of range values', async () => {
            return req.get('/latlong').query({ location: '91,181' }).badRequest()
        })
    })
})

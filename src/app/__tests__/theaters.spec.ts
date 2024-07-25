import { expect } from '@jest/globals'
import { TheatersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { createTheater, createTheaters } from './theaters.fixture'

describe('/theaters', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let theatersService: TheatersService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, TheatersModule],
            controllers: [TheatersController]
        })
        req = testContext.request

        theatersService = testContext.module.get(TheatersService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /theaters', () => {
        const createData = {
            name: `Theater-Name`,
            latlong: { latitude: 38.123, longitude: 138.678 },
            seatmap: { blocks: [{ name: 'A', rows: [{ name: '1', seats: 'OOOOXXOOOO' }] }] }
        }

        it('Create a theater', async () => {
            const res = await req.post('/theaters').body(createData).created()

            expect(res.body).toEqual({ id: expect.anything(), ...createData })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            return req.post('/theaters').body({}).badRequest()
        })
    })

    describe('PATCH /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(theatersService)
        })

        it('Update a theater', async () => {
            const updateData = {
                name: `Update-Name`,
                latlong: { latitude: 30.0, longitude: 120.0 },
                seatmap: []
            }

            const updateResponse = await req.patch(`/theaters/${theater.id}`).body(updateData).ok()
            expect(updateResponse.body).toEqual({ ...theater, ...updateData })

            const getResponse = await req.get(`/theaters/${theater.id}`).ok()
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if theater is not found', async () => {
            return req.patch(`/theaters/${nullObjectId}`).body({}).notFound()
        })
    })

    describe('DELETE /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(theatersService)
        })

        it('Delete a theater', async () => {
            await req.delete(`/theaters/${theater.id}`).ok()
            await req.get(`/theaters/${theater.id}`).notFound()
        })

        it('NOT_FOUND(404) if theater is not found', async () => {
            return req.delete(`/theaters/${nullObjectId}`).notFound()
        })
    })

    describe('GET /theaters', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(theatersService, 20)
        })

        it('Retrieve all theaters', async () => {
            const res = await req.get('/theaters').query({ orderby: 'name:asc' }).ok()

            expect(res.body.items).toEqual(theaters)
        })

        it('Retrieve theaters by partial name', async () => {
            const res = await req.get('/theaters').query({ name: 'Theater-' }).ok()

            expect(res.body.items).toEqual(expect.arrayContaining(theaters))
        })
    })

    describe('GET /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(theatersService)
        })

        it('Retrieve a theater by ID', async () => {
            const res = await req.get(`/theaters/${theater.id}`).ok()

            expect(res.body).toEqual(theater)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            return req.get(`/theaters/${nullObjectId}`).notFound()
        })
    })
})

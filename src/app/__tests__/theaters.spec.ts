import { expect } from '@jest/globals'
import { TheatersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import {
    HttpRequest,
    HttpTestContext,
    createHttpTestContext,
    expectBadRequest,
    expectCreated,
    expectNotFound,
    expectOk
} from 'common/test'
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
            const res = await req.post({ url: '/theaters', body: createData })
            expectCreated(res)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createData
            })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/theaters',
                body: {}
            })
            expectBadRequest(res)
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

            const updateResponse = await req.patch({ url: `/theaters/${theater.id}`, body: updateData })
            expectOk(updateResponse)

            const getResponse = await req.get({ url: `/theaters/${theater.id}` })
            expectOk(getResponse)

            const expected = { ...theater, ...updateData }
            expect(updateResponse.body).toEqual(expected)
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if theater is not found', async () => {
            const res = await req.patch({
                url: `/theaters/${nullObjectId}`,
                body: {}
            })
            expectNotFound(res)
        })
    })

    describe('DELETE /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(theatersService)
        })

        it('Delete a theater', async () => {
            const deleteResponse = await req.delete({ url: `/theaters/${theater.id}` })
            expectOk(deleteResponse)

            const getResponse = await req.get({ url: `/theaters/${theater.id}` })
            expectNotFound(getResponse)
        })

        it('NOT_FOUND(404) if theater is not found', async () => {
            const res = await req.delete({ url: `/theaters/${nullObjectId}` })
            expectNotFound(res)
        })
    })

    describe('GET /theaters', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(theatersService, 20)
        })

        it('Retrieve all theaters', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { orderby: 'name:asc' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(theaters)
        })

        it('Retrieve theaters by partial name', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { name: 'Theater-' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(expect.arrayContaining(theaters))
        })
    })

    describe('GET /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(theatersService)
        })

        it('Retrieve a theater by ID', async () => {
            const res = await req.get({ url: `/theaters/${theater.id}` })
            expectOk(res)
            expect(res.body).toEqual(theater)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/theaters/${nullObjectId}` })
            expectNotFound(res)
        })
    })
})

import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { TheatersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createTheaters, seatmap } from './theaters.fixture'

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
        if (testContext) await testContext.close()
    })

    describe('POST /theaters', () => {
        const createData = {
            name: `Theater-Name`,
            latlong: { latitude: 38.123, longitude: 138.678 },
            seatmap
        }

        it('Create a theater', async () => {
            const res = await req.post({ url: '/theaters', body: createData })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
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

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            const theaters = await createTheaters(theatersService, 1)
            theater = theaters[0]
        })

        it('Update a theater', async () => {
            const updateData = {
                name: `Update-Name`,
                latlong: { latitude: 30.0, longitude: 120.0 },
                seatmap: []
            }

            const updateResponse = await req.patch({ url: `/theaters/${theater.id}`, body: updateData })
            expect(updateResponse.status).toEqual(HttpStatus.OK)

            const getResponse = await req.get({ url: `/theaters/${theater.id}` })

            const expected = { ...theater, ...updateData }
            expect(updateResponse.body).toEqual(expected)
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if theater is not found', async () => {
            const res = await req.patch({
                url: `/theaters/${nullObjectId}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            const theaters = await createTheaters(theatersService, 1)
            theater = theaters[0]
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
            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
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
            const theaters = await createTheaters(theatersService, 1)
            theater = theaters[0]
        })

        it('Retrieve a theater by ID', async () => {
            const res = await req.get({ url: `/theaters/${theater.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(theater)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/theaters/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })
})

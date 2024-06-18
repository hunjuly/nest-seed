import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { TheatersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createTheaters, seatmap, sortByName, sortByNameDescending } from './theaters.fixture'

describe('/theaters', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let theaters: TheaterDto[] = []
    let theater: TheaterDto

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, TheatersModule],
            controllers: [TheatersController]
        })
        req = testContext.request

        const theatersService = testContext.module.get(TheatersService)

        theaters = await createTheaters(theatersService, 100)
        theater = theaters[0]
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    describe('POST /theaters', () => {
        const createData = {
            name: `Theater-Name`,
            coordinates: { latitude: 38.123, longitude: 138.678 },
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
        it('Update a theater', async () => {
            const updateData = {
                name: `Update-Name`,
                coordinates: { latitude: 30.0, longitude: 120.0 },
                seatmap: []
            }

            const updateResponse = await req.patch({ url: `/theaters/${theater.id}`, body: updateData })
            expect(updateResponse.status).toEqual(HttpStatus.OK)

            const getResponse = await req.get({ url: `/theaters/${theater.id}` })

            const expected = { ...theater, ...updateData }
            expect(updateResponse.body).toEqual(expected)
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/theaters/${theater.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
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
        it('Delete a theater', async () => {
            const deleteResponse = await req.delete({ url: `/theaters/${theater.id}` })
            const getResponse = await req.get({ url: `/theaters/${theater.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if theater is not found', async () => {
            const res = await req.delete({ url: `/theaters/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /theaters', () => {
        it('Retrieve all theaters', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(theaters)
        })

        it('Retrieve theaters by name', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { name: theater.name }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([theater])
        })

        it('Retrieve theaters by partial name', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { name: 'Theater-' }
            })

            sortByName(res.body.items)
            sortByName(theaters)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(theaters)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50

            const res = await req.get({
                url: '/theaters',
                query: { skip, take, orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({
                items: theaters.slice(skip, skip + take),
                total: theaters.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { orderby: 'name:asc' }
            })

            sortByName(theaters)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(theaters)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/theaters',
                query: { orderby: 'name:desc' }
            })

            sortByNameDescending(theaters)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(theaters)
        })
    })

    describe('POST /theaters/findByIds', () => {
        it('Retrieve theaters by multiple IDs', async () => {
            const theaterIds = theaters.map((theater) => theater.id)

            const res = await req.post({
                url: '/theaters/findByIds',
                body: theaterIds
            })

            sortByName(res.body)
            sortByName(theaters)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(theaters)
        })
    })

    describe('GET /theaters/:id', () => {
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

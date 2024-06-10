import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { ShowtimeDto } from 'app/services/showtimes'
import { nullObjectId } from 'common'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createShowtimes, sortByName, sortByNameDescending } from './showtimes.controller.fixture'

describe('ShowtimesController', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let showtimes: ShowtimeDto[] = []
    let showtime: ShowtimeDto

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        showtimes = await createShowtimes(req)
        showtime = showtimes[0]
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    describe('POST /showtimes', () => {
        const createShowtimeDto = {
            name: 'showtime name',
            email: 'user@mail.com',
            desc: 'showtime long text',
            date: new Date('2020-12-12'),
            enums: ['EnumA', 'EnumB', 'EnumC'],
            integer: 100
        }

        it('Create a showtime', async () => {
            const res = await req.post({ url: '/showtimes', body: createShowtimeDto })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createShowtimeDto
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/showtimes',
                body: { ...createShowtimeDto, email: showtime.email }
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/showtimes',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /showtimes/:id', () => {
        it('Update a showtime', async () => {
            const updateData = {
                name: 'update name',
                email: 'new@mail.com',
                desc: 'update long text',
                date: new Date('2000-12-12'),
                enums: ['EnumC', 'EnumD', 'EnumE'],
                integer: 999
            }

            const updateResponse = await req.patch({ url: `/showtimes/${showtime.id}`, body: updateData })
            expect(updateResponse.status).toEqual(HttpStatus.OK)

            const getResponse = await req.get({ url: `/showtimes/${showtime.id}` })

            expect(updateResponse.body).toEqual({ ...showtime, ...updateData })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/showtimes/${showtime.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
        })

        it('NOT_FOUND(404) if showtime is not found', async () => {
            const res = await req.patch({
                url: `/showtimes/${nullObjectId}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /showtimes/:id', () => {
        it('Delete a showtime', async () => {
            const deleteResponse = await req.delete({ url: `/showtimes/${showtime.id}` })
            const getResponse = await req.get({ url: `/showtimes/${showtime.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if showtime is not found', async () => {
            const res = await req.delete({ url: `/showtimes/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /showtimes', () => {
        it('Retrieve all showtimes', async () => {
            const res = await req.get({
                url: '/showtimes',
                query: { orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(showtimes)
        })

        it('Retrieve showtimes by name', async () => {
            const res = await req.get({
                url: '/showtimes',
                query: { name: showtime.name }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([showtime])
        })

        it('Retrieve showtimes by partial name', async () => {
            const res = await req.get({
                url: '/showtimes',
                query: { name: 'Showtime-' }
            })

            sortByName(res.body.items)
            sortByName(showtimes)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(showtimes)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50

            const res = await req.get({
                url: '/showtimes',
                query: { skip, take, orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({
                items: showtimes.slice(skip, skip + take),
                total: showtimes.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/showtimes',
                query: { orderby: 'name:asc' }
            })

            sortByName(showtimes)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(showtimes)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/showtimes',
                query: { orderby: 'name:desc' }
            })

            sortByNameDescending(showtimes)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(showtimes)
        })
    })

    describe('POST /showtimes/findByIds', () => {
        it('Retrieve showtimes by multiple IDs', async () => {
            const showtimeIds = showtimes.map((showtime) => showtime.id)

            const res = await req.post({
                url: '/showtimes/findByIds',
                body: showtimeIds
            })

            sortByName(res.body)
            sortByName(showtimes)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(showtimes)
        })
    })

    describe('GET /showtimes/:id', () => {
        it('Retrieve a showtime by ID', async () => {
            const res = await req.get({ url: `/showtimes/${showtime.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(showtime)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/showtimes/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })
})

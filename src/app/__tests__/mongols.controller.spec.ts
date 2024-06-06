import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MongolDto } from 'app/services/mongols'
import { nullObjectId } from 'common'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import {
    createMongolDto,
    createManyMongols,
    sortByName,
    sortByNameDescending
} from './mongols.controller.fixture'

describe('MongolsController', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let mongols: MongolDto[] = []
    let mongol: MongolDto

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        mongols = await createManyMongols(req)
        mongol = mongols[0]
    })

    afterEach(async () => {
        if (testingContext) {
            await testingContext.close()
        }
    })

    describe('POST /mongols', () => {
        it('Create a mongol', async () => {
            const res = await req.post({
                url: '/mongols',
                body: createMongolDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createMongolDto
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/mongols',
                body: { ...createMongolDto, email: mongol.email }
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/mongols',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /mongols/:id', () => {
        it('Update a mongol', async () => {
            const updateResponse = await req.patch({
                url: `/mongols/${mongol.id}`,
                body: { name: 'Updated Mongol' }
            })

            const getResponse = await req.get({ url: `/mongols/${mongol.id}` })

            expect(updateResponse.status).toEqual(HttpStatus.OK)
            expect(updateResponse.body).toEqual({ ...mongol, name: 'Updated Mongol' })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/mongols/${mongol.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
        })

        it('NOT_FOUND(404) if mongol is not found', async () => {
            const res = await req.patch({
                url: `/mongols/${nullObjectId}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /mongols/:id', () => {
        it('Delete a mongol', async () => {
            const deleteResponse = await req.delete({ url: `/mongols/${mongol.id}` })
            const getResponse = await req.get({ url: `/mongols/${mongol.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if mongol is not found', async () => {
            const res = await req.delete({ url: `/mongols/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /mongols', () => {
        it('Retrieve all mongols', async () => {
            const res = await req.get({
                url: '/mongols',
                query: { orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(mongols)
        })

        it('Retrieve mongols by name', async () => {
            const res = await req.get({
                url: '/mongols',
                query: { name: mongol.name }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([mongol])
        })

        it('Retrieve mongols by partial name', async () => {
            const res = await req.get({
                url: '/mongols',
                query: { name: 'Mongol-' }
            })

            sortByName(res.body.items)
            sortByName(mongols)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(mongols)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50

            const res = await req.get({
                url: '/mongols',
                query: { skip, take, orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({
                items: mongols.slice(skip, skip + take),
                total: mongols.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/mongols',
                query: { orderby: 'name:asc' }
            })

            sortByName(mongols)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(mongols)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/mongols',
                query: { orderby: 'name:desc' }
            })

            sortByNameDescending(mongols)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(mongols)
        })
    })

    describe('POST /mongols/findByIds', () => {
        it('Retrieve mongols by multiple IDs', async () => {
            const mongolIds = mongols.map((mongol) => mongol.id)

            const res = await req.post({
                url: '/mongols/findByIds',
                body: mongolIds
            })

            sortByName(res.body)
            sortByName(mongols)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(mongols)
        })
    })

    describe('GET /mongols/:id', () => {
        it('Retrieve a mongol by ID', async () => {
            const res = await req.get({ url: `/mongols/${mongol.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(mongol)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/mongols/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })
})

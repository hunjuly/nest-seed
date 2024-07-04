import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { PsqlDto } from 'app/services/psqls'
import { nullUUID } from 'common'
import { HttpTestContext, createHttpTestContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createPsqls, createPsqlDto, sortByName, sortByNameDescending } from './psqls.fixture'

describe('PsqlsController', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let psqls: PsqlDto[] = []
    let psql: PsqlDto

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [AppModule] })
        req = testContext.request

        psqls = await createPsqls(req)
        psql = psqls[0]
    })

    afterEach(async () => {
        await testContext.close()
    })

    describe('POST /psqls', () => {
        it('Create a psql', async () => {
            const res = await req.post({
                url: '/psqls',
                body: createPsqlDto
            })

            expectCreated(res)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createPsqlDto
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/psqls',
                body: { ...createPsqlDto, email: psql.email }
            })

            expectConflict(res)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/psqls',
                body: {}
            })

            expectBadRequest(res)
        })
    })

    describe('PATCH /psqls/:id', () => {
        it('Update a psql', async () => {
            const updateResponse = await req.patch({
                url: `/psqls/${psql.id}`,
                body: { name: 'Updated Psql' }
            })

            const getResponse = await req.get({ url: `/psqls/${psql.id}` })

            expectOk(updateResponse)
            expect(updateResponse.body).toEqual({ ...psql, name: 'Updated Psql' })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/psqls/${psql.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
        })

        it('NOT_FOUND(404) if psql is not found', async () => {
            const res = await req.patch({
                url: `/psqls/${nullUUID}`,
                body: {}
            })

            expectNotFound(res)
        })
    })

    describe('DELETE /psqls/:id', () => {
        it('Delete a psql', async () => {
            const deleteResponse = await req.delete({ url: `/psqls/${psql.id}` })
            const getResponse = await req.get({ url: `/psqls/${psql.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if psql is not found', async () => {
            const res = await req.delete({ url: `/psqls/${nullUUID}` })

            expectNotFound(res)
        })
    })

    describe('GET /psqls', () => {
        it('Retrieve all psqls', async () => {
            const res = await req.get({
                url: '/psqls',
                query: { orderby: 'name:asc' }
            })

            expectOk(res)
            expect(res.body.items).toEqual(psqls)
        })

        it('Retrieve psqls by name', async () => {
            const res = await req.get({
                url: '/psqls',
                query: { name: psql.name }
            })

            expectOk(res)
            expect(res.body.items).toEqual([psql])
        })

        it('Retrieve psqls by partial name', async () => {
            const res = await req.get({
                url: '/psqls',
                query: { name: 'Psql-' }
            })

            sortByName(res.body.items)
            sortByName(psqls)

            expectOk(res)
            expect(res.body.items).toEqual(psqls)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50

            const res = await req.get({
                url: '/psqls',
                query: { skip, take, orderby: 'name:asc' }
            })

            expectOk(res)
            expect(res.body).toEqual({
                items: psqls.slice(skip, skip + take),
                total: psqls.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/psqls',
                query: { orderby: 'name:asc' }
            })

            sortByName(psqls)

            expectOk(res)
            expect(res.body.items).toEqual(psqls)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/psqls',
                query: { orderby: 'name:desc' }
            })

            sortByNameDescending(psqls)

            expectOk(res)
            expect(res.body.items).toEqual(psqls)
        })
    })

    describe('POST /psqls/findByIds', () => {
        it('Retrieve psqls by multiple IDs', async () => {
            const psqlIds = psqls.map((psql) => psql.id)

            const res = await req.post({
                url: '/psqls/findByIds',
                body: psqlIds
            })

            sortByName(res.body)
            sortByName(psqls)

            expectOk(res)
            expect(res.body).toEqual(psqls)
        })
    })

    describe('GET /psqls/:id', () => {
        it('Retrieve a psql by ID', async () => {
            const res = await req.get({ url: `/psqls/${psql.id}` })

            expectOk(res)
            expect(res.body).toEqual(psql)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/psqls/${nullUUID}` })

            expectNotFound(res)
        })
    })
})

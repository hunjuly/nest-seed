import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { TheaterDto } from 'app/services/theaters'
import { nullObjectId } from 'common'
import {
    HttpClient,
    HttpTestContext,
    createHttpTestContext,
    expectEqualUnsorted
} from 'common/test'
import { createTheater, createTheaters, makeTheaterDtos } from './theaters.fixture'

describe('/theaters', () => {
    let testContext: HttpTestContext
    let client: HttpClient

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [AppModule] })
        client = testContext.createClient('/theaters')
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /theaters', () => {
        it('should create a theater and return CREATED(201) status', async () => {
            const { createDto, expectedDto } = makeTheaterDtos()

            const { body } = await client.post().body(createDto).created()

            expect(body).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.post().body({}).badRequest()
        })
    })

    describe('PATCH /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should update a theater', async () => {
            const updateDto = { name: `Update-Name`, latlong: { latitude: 30.0, longitude: 120.0 } }

            const updated = await client.patch(theater.id).body(updateDto).ok()
            expect(updated.body).toEqual({ ...theater, ...updateDto })

            const got = await client.get(theater.id).ok()
            expect(got.body).toEqual(updated.body)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            return client.patch(nullObjectId).body({}).notFound()
        })
    })

    describe('DELETE /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should delete a theater', async () => {
            await client.delete(theater.id).ok()
            await client.get(theater.id).notFound()
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            return client.delete(nullObjectId).notFound()
        })
    })

    describe('GET /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should get a theater', async () => {
            const { body } = await client.get(theater.id).ok()
            expect(body).toEqual(theater)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            return client.get(nullObjectId).notFound()
        })
    })

    describe('GET /theaters', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(client)
        })

        it('should retrieve theaters with default pagination', async () => {
            const { body } = await client.get().ok()
            const { items, ...paginated } = body

            expect(paginated).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: theaters.length
            })
            expectEqualUnsorted(items, theaters)
        })

        it('should retrieve theaters by partial title', async () => {
            const partialName = 'Theater-'
            const { body } = await client.get().query({ name: partialName }).ok()

            const expected = theaters.filter((theater) => theater.name.startsWith(partialName))
            expectEqualUnsorted(body.items, expected)
        })
    })
})

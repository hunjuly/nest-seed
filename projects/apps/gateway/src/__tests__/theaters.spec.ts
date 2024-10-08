import { expect } from '@jest/globals'
import {
    HttpClient,
    HttpTestContext,
    createHttpTestContext,
    createMicroserviceTestContext,
    expectEqualUnsorted,
    nullObjectId,
    pickIds
} from 'common'
import { TheaterDto } from 'services/theaters'
import { GatewayModule } from '../gateway.module'
import { createTheater, createTheaters, makeTheaterDto } from './theaters.fixture'
import { Config } from 'config'
import { ServicesModule } from 'services/services.module'

describe('/theaters', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let closeInfra: () => Promise<void>

    beforeEach(async () => {
        const { port, close } = await createMicroserviceTestContext({ imports: [ServicesModule] })
        closeInfra = close
        Config.service.port = port

        testContext = await createHttpTestContext({ imports: [GatewayModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext?.close()
        await closeInfra()
    })

    describe('POST /theaters', () => {
        it('should create a theater and return CREATED(201) status', async () => {
            const { createDto, expectedDto } = makeTheaterDto()

            const { body } = await client.post('/theaters').body(createDto).created()

            expect(body).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.post('/theaters').body({}).badRequest()
        })
    })

    describe('PATCH /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should update a theater', async () => {
            const updateDto = {
                name: `Update-Name`,
                latlong: { latitude: 30.0, longitude: 120.0 },
                seatmap: []
            }

            const updated = await client.patch(`/theaters/${theater.id}`).body(updateDto).ok()
            expect(updated.body).toEqual({ ...theater, ...updateDto })

            const got = await client.get(`/theaters/${theater.id}`).ok()
            expect(got.body).toEqual(updated.body)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            return client.patch(`/theaters/${nullObjectId}`).body({}).notFound()
        })
    })

    describe('DELETE /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should delete a theater', async () => {
            await client.delete(`/theaters/${theater.id}`).ok()
            await client.get(`/theaters/${theater.id}`).notFound()
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            return client.delete(`/theaters/${nullObjectId}`).notFound()
        })
    })

    describe('GET /theaters/:id', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should get a theater', async () => {
            const { body } = await client.get(`/theaters/${theater.id}`).ok()
            expect(body).toEqual(theater)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            return client.get(`/theaters/${nullObjectId}`).notFound()
        })
    })

    describe('GET /theaters', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(client)
        })

        it('should retrieve theaters with default pagination', async () => {
            const { body } = await client.get('/theaters').ok()
            const { items, ...paginated } = body

            expect(paginated).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: theaters.length
            })
            expectEqualUnsorted(items, theaters)
        })

        it('should retrieve theaters by partial name', async () => {
            const partialName = 'Theater-'
            const { body } = await client.get('/theaters').query({ name: partialName }).ok()

            const expected = theaters.filter((theater) => theater.name.startsWith(partialName))
            expectEqualUnsorted(body.items, expected)
        })
    })

    describe('POST /theaters/getByIds', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(client)
        })

        it('should retrieve theaters with theaterIds', async () => {
            const expectedTheaters = theaters.slice(0, 5)
            const queryDto = { theaterIds: pickIds(expectedTheaters) }

            const { body } = await client.post('/theaters/getByIds').body(queryDto).ok()

            expectEqualUnsorted(body, expectedTheaters)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            const queryDto = { theaterIds: [nullObjectId] }

            return client.post('/theaters/getByIds').body(queryDto).notFound()
        })
    })
})

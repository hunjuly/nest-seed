import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { TheaterDto } from 'app/services/theaters'
import {
    createMicroserviceTestContext,
    expectEqualUnsorted,
    MicroserviceClient,
    MicroserviceTestContext,
    nullObjectId,
    pickIds
} from 'common'
import { ServicesModule } from '../services.module'
import { createTheater, createTheaters, makeTheaterDto } from './theaters.fixture'

describe('/theaters', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext.close()
    })

    describe('createTheater', () => {
        it('should create a theater and return CREATED(201) status', async () => {
            const { createDto, expectedDto } = makeTheaterDto()
            const body = await createTheater(client, createDto)

            expect(body).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            await client.error('createTheater', {}, HttpStatus.BAD_REQUEST)
        })
    })

    describe('updateTheater', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should update a theater', async () => {
            const theaterId = theater.id
            const updateDto = {
                name: `Update-Name`,
                latlong: { latitude: 30.0, longitude: 120.0 },
                seatmap: []
            }

            const updatedTheater = await client.send('updateTheater', { theaterId, updateDto })
            expect(updatedTheater).toEqual({ ...theater, ...updateDto })

            const gotTheater = await client.send('getTheater', theater.id)
            expect(gotTheater.body).toEqual(updatedTheater.body)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            await client.error(
                'updateTheater',
                { theaterId: nullObjectId, updateDto: {} },
                HttpStatus.NOT_FOUND
            )
        })
    })

    describe('deleteTheater', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should delete a theater', async () => {
            await client.send('deleteTheater', theater.id)
            await client.error('getTheater', theater.id, HttpStatus.NOT_FOUND)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            await client.error('deleteTheater', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('getTheater', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should get a theater', async () => {
            const gotTheater = await client.send('getTheater', theater.id)
            expect(gotTheater).toEqual(theater)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            await client.error('getTheater', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('findTheaters', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(client)
        })

        it('should retrieve theaters with default pagination', async () => {
            const { items, ...paginated } = await client.send('findTheaters', {})

            expect(paginated).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: theaters.length
            })
            expectEqualUnsorted(items, theaters)
        })

        it('should retrieve theaters by partial name', async () => {
            const partialName = 'Theater-'
            const { items } = await client.send('findTheaters', { queryDto: { name: partialName } })

            const expected = theaters.filter((theater) => theater.name.startsWith(partialName))
            expectEqualUnsorted(items, expected)
        })
    })

    describe('getTheatersByIds', () => {
        let theaters: TheaterDto[]

        beforeEach(async () => {
            theaters = await createTheaters(client)
        })

        it('should retrieve theaters with theaterIds', async () => {
            const expectedTheaters = theaters.slice(0, 5)
            const gotTheaters = await client.send('getTheatersByIds', pickIds(expectedTheaters))
            expectEqualUnsorted(gotTheaters, expectedTheaters)
        })

        it('should return NOT_FOUND(404) when theater does not exist', async () => {
            await client.error('getTheatersByIds', [nullObjectId], HttpStatus.NOT_FOUND)
        })
    })

    describe('theatersExist', () => {
        let theater: TheaterDto

        beforeEach(async () => {
            theater = await createTheater(client)
        })

        it('should return true when theater does exist', async () => {
            const exists = await client.send('theatersExist', [theater.id])
            expect(exists).toBeTruthy()
        })

        it('should return false when theater does not exist', async () => {
            const exists = await client.send('theatersExist', [nullObjectId])
            expect(exists).toBeFalsy()
        })
    })
})

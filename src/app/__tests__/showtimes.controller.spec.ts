import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { CreateShowtimesRequest } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.controller.fixture'
import { sortShowtimes } from './showtimes.controller.fixture'
import { createTheaters } from './theaters.controller.fixture'

describe('ShowtimesController', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movie: MovieDto
    let theaters: TheaterDto[]
    let createData: CreateShowtimesRequest

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        const movies = await createMovies(req, 1)
        movie = movies[0]

        theaters = await createTheaters(req, 2)

        createData = {
            movieId: movie.id,
            theaterIds: theaters.map((theater) => theater.id),
            durationMinutes: 90,
            startTimes: [
                new Date(2020, 0, 31, 12, 0),
                new Date(2020, 0, 31, 14, 0),
                new Date(2020, 0, 31, 16, 30),
                new Date(2020, 0, 31, 18, 30)
            ]
        }
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    describe('POST /showtimes', () => {
        it('Create showtimes', async () => {
            const res = await req.post({ url: '/showtimes', body: createData })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body.status).toEqual('success')
        })

        it('Conflicting showtimes', async () => {
            const createResponse = await req.post({ url: '/showtimes', body: createData })
            expect(createResponse.statusCode).toEqual(HttpStatus.CREATED)

            const conflictData = {
                ...createData,
                startTimes: [new Date(2020, 0, 31, 12, 0), new Date(2020, 0, 31, 16, 0)]
            }
            const conflictResponse = await req.post({ url: '/showtimes', body: conflictData })
            expect(conflictResponse.statusCode).toEqual(HttpStatus.CONFLICT)

            const conflictShowtimes = [
                {
                    id: expect.anything(),
                    movieId: movie.id,
                    theaterId: theaters[0].id,
                    startTime: new Date(2020, 0, 31, 12, 0),
                    endTime: new Date(2020, 0, 31, 13, 30)
                },
                {
                    id: expect.anything(),
                    movieId: movie.id,
                    theaterId: theaters[0].id,
                    startTime: new Date(2020, 0, 31, 16, 30),
                    endTime: new Date(2020, 0, 31, 18, 0)
                },
                {
                    id: expect.anything(),
                    movieId: movie.id,
                    theaterId: theaters[1].id,
                    startTime: new Date(2020, 0, 31, 12, 0),
                    endTime: new Date(2020, 0, 31, 13, 30)
                },
                {
                    id: expect.anything(),
                    movieId: movie.id,
                    theaterId: theaters[1].id,
                    startTime: new Date(2020, 0, 31, 16, 30),
                    endTime: new Date(2020, 0, 31, 18, 0)
                }
            ]

            sortShowtimes(conflictResponse.body.conflictShowtimes)
            sortShowtimes(conflictShowtimes as any)

            expect(conflictResponse.body).toEqual({
                status: 'conflict',
                conflictShowtimes
            })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({ url: '/showtimes', body: {} })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })
})

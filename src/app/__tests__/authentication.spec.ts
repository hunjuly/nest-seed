import { HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppModule } from 'app/app.module'
import { nullUUID, sleep } from 'common'
import { UserCredentials, createUser } from './authentication.fixture'
import { HttpRequest, HttpTestingContext, createHttpTestingContext } from 'common/test'

jest.mock('config', () => {
    const actualConfig = jest.requireActual('config')

    return {
        ...actualConfig,
        authOptions: {
            accessSecret: 'mockAccessSecret',
            accessTokenExpiration: '1s',
            refreshSecret: 'mockRefreshSecret',
            refreshTokenExpiration: '1s'
        }
    }
})

describe('Authentication', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let jwtService: JwtService
    let user: UserCredentials

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({
            imports: [AppModule]
        })

        req = testingContext.request

        jwtService = testingContext.module.get(JwtService)
        user = await createUser(req)
    })

    afterEach(async () => {
        if (testingContext) {
            await testingContext.close()
        }
    })

    describe('Operations without login', () => {
        describe('POST /auth/login', () => {
            it('Returns CREATED(201) status and AuthTokens on successful login', async () => {
                const res = await req.post({
                    url: '/auth/login',
                    body: user
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toEqual({
                    accessToken: expect.anything(),
                    refreshToken: expect.anything()
                })
            })

            it('Returns UNAUTHORIZED(401) status when providing an incorrect password', async () => {
                const res = await req.post({
                    url: '/auth/login',
                    body: { email: user.email, password: 'wrong password' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('Returns UNAUTHORIZED(401) status when providing a non-existent email', async () => {
                const res = await req.post({
                    url: '/auth/login',
                    body: { email: 'unknown@mail.com', password: '' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })
    })

    describe('Operations with login', () => {
        let accessToken: any
        let refreshToken: any

        beforeEach(async () => {
            const res = await req.post({
                url: '/auth/login',
                body: user
            })

            accessToken = res.body.accessToken
            refreshToken = res.body.refreshToken
        })

        describe('POST /auth/refresh', () => {
            it('Returns a new AuthTokens when providing a valid refreshToken', async () => {
                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body.accessToken).not.toEqual(accessToken)
                expect(res.body.refreshToken).not.toEqual(refreshToken)
            })

            it('Returns UNAUTHORIZED(401) status when providing an incorrect refreshToken', async () => {
                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken: 'invalid-token' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('Returns UNAUTHORIZED(401) status when providing an expired refreshToken', async () => {
                await sleep(1500)

                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })

        describe('JwtAuthGuard', () => {
            it('Allows access when providing a valid accessToken', async () => {
                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: { Authorization: `Bearer ${accessToken}` }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('Returns UNAUTHORIZED(401) status when providing an accessToken with an incorrect format', async () => {
                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: { Authorization: `Bearer invalid_access_token` }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('Returns UNAUTHORIZED(401) status when providing an accessToken containing incorrect data', async () => {
                const wrongUserIdToken = jwtService.sign(
                    { userId: nullUUID },
                    { secret: 'mockAccessSecret', expiresIn: '15m' }
                )

                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: { Authorization: `Bearer ${wrongUserIdToken}` }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })
    })
})

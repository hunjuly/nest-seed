import { JwtService } from '@nestjs/jwt'
import { AuthController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from 'app/services/auth'
import { UsersModule, UsersService } from 'app/services/users'
import { nullUUID, sleep } from 'common'
import {
    HttpRequest,
    HttpTestContext,
    createHttpTestContext,
    expectCreated,
    expectOk,
    expectUnauthorized
} from 'common/test'
import { UserCredentials, createUser } from './authentication.fixture'

jest.mock('config', () => {
    const actualConfig = jest.requireActual('config')

    return {
        ...actualConfig,
        authOptions: {
            accessSecret: 'mockAccessSecret',
            accessTokenExpiration: '3s',
            refreshSecret: 'mockRefreshSecret',
            refreshTokenExpiration: '3s'
        }
    }
})

describe('/auth', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let jwtService: JwtService
    let user: UserCredentials

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, AuthModule, UsersModule],
            controllers: [AuthController]
        })
        req = testContext.request

        const module = testContext.module

        jwtService = module.get(JwtService)

        const usersService = module.get(UsersService)
        user = await createUser(usersService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /auth/login', () => {
        it('Returns CREATED(201) status and AuthTokens on successful login', async () => {
            const res = await req.post({
                url: '/auth/login',
                body: user
            })
            expectCreated(res)
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
            expectUnauthorized(res)
        })

        it('Returns UNAUTHORIZED(401) status when providing a non-existent email', async () => {
            const res = await req.post({
                url: '/auth/login',
                body: { email: 'unknown@mail.com', password: '' }
            })
            expectUnauthorized(res)
        })
    })

    describe('POST /auth/refresh', () => {
        let accessToken: string
        let refreshToken: string

        beforeEach(async () => {
            const res = await req.post({ url: '/auth/login', body: user })

            accessToken = res.body.accessToken
            refreshToken = res.body.refreshToken
        })

        it('Returns a new AuthTokens when providing a valid refreshToken', async () => {
            const res = await req.post({
                url: '/auth/refresh',
                body: { refreshToken }
            })
            expectCreated(res)
            expect(res.body.accessToken).not.toEqual(accessToken)
            expect(res.body.refreshToken).not.toEqual(refreshToken)
        })

        it('Returns UNAUTHORIZED(401) status when providing an incorrect refreshToken', async () => {
            const res = await req.post({
                url: '/auth/refresh',
                body: { refreshToken: 'invalid-token' }
            })
            expectUnauthorized(res)
        })

        it('Returns UNAUTHORIZED(401) status when providing an expired refreshToken', async () => {
            await sleep(3500)

            const res = await req.post({
                url: '/auth/refresh',
                body: { refreshToken }
            })
            expectUnauthorized(res)
        })

        it('Allows access when providing a valid accessToken', async () => {
            const res = await req.get({
                url: `/auth/jwt-testing`,
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            expectOk(res)
        })

        it('Allows access when Public decorator', async () => {
            const res = await req.get({ url: `/auth/public-testing` })
            expectOk(res)
        })

        it('Returns UNAUTHORIZED(401) status when providing an accessToken with an incorrect format', async () => {
            const res = await req.get({
                url: `/auth/jwt-testing`,
                headers: { Authorization: `Bearer invalid_access_token` }
            })
            expectUnauthorized(res)
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
            expectUnauthorized(res)
        })
    })
})

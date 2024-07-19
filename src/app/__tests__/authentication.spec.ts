import { JwtService } from '@nestjs/jwt'
import { AuthController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from 'app/services/auth'
import { UsersModule, UsersService } from 'app/services/users'
import { nullUUID, sleep } from 'common'
import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { UserCredentials, createUser } from './authentication.fixture'

jest.mock('config', () => {
    const { Config, ...rest } = jest.requireActual('config')

    return {
        ...rest,
        Config: {
            ...Config,
            auth: {
                accessSecret: 'mockAccessSecret',
                accessTokenExpiration: '3s',
                refreshSecret: 'mockRefreshSecret',
                refreshTokenExpiration: '3s'
            }
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
            const res = await req.post('/auth/login').body(user).created()

            expect(res.body).toEqual({
                accessToken: expect.anything(),
                refreshToken: expect.anything()
            })
        })

        it('Returns UNAUTHORIZED(401) status when providing an incorrect password', async () => {
            return req
                .post('/auth/login')
                .body({ email: user.email, password: 'wrong password' })
                .unauthorized()
        })

        it('Returns UNAUTHORIZED(401) status when providing a non-existent email', async () => {
            return req
                .post('/auth/login')
                .body({ email: 'unknown@mail.com', password: '' })
                .unauthorized()
        })
    })

    describe('POST /auth/refresh', () => {
        let accessToken: string
        let refreshToken: string

        beforeEach(async () => {
            const { body } = await req.post('/auth/login').body(user).created()
            accessToken = body.accessToken
            refreshToken = body.refreshToken
        })

        it('Returns a new AuthTokens when providing a valid refreshToken', async () => {
            const { body } = await req.post('/auth/refresh').body({ refreshToken }).created()

            expect(body.accessToken).not.toEqual(accessToken)
            expect(body.refreshToken).not.toEqual(refreshToken)
        })

        it('Returns UNAUTHORIZED(401) status when providing an incorrect refreshToken', async () => {
            return req.post('/auth/refresh').body({ refreshToken: 'invalid-token' }).unauthorized()
        })

        it('Returns UNAUTHORIZED(401) status when providing an expired refreshToken', async () => {
            await sleep(3500)

            return req.post('/auth/refresh').body({ refreshToken }).unauthorized()
        })

        it('Allows access when providing a valid accessToken', async () => {
            return req
                .get('/auth/jwt-testing')
                .headers({ Authorization: `Bearer ${accessToken}` })
                .ok()
        })

        it('Allows access when Public decorator', async () => {
            return req.get('/auth/public-testing').ok()
        })

        it('Returns UNAUTHORIZED(401) status when providing an accessToken with an incorrect format', async () => {
            return req
                .get('/auth/jwt-testing')
                .headers({ Authorization: 'Bearer invalid_access_token' })
                .unauthorized()
        })

        it('Returns UNAUTHORIZED(401) status when providing an accessToken containing incorrect data', async () => {
            const wrongUserIdToken = jwtService.sign(
                { userId: nullUUID },
                { secret: 'mockAccessSecret', expiresIn: '15m' }
            )

            return req
                .get('/auth/jwt-testing')
                .headers({ Authorization: `Bearer ${wrongUserIdToken}` })
                .unauthorized()
        })
    })
})

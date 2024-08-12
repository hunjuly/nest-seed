import { JwtService } from '@nestjs/jwt'
import { AppModule } from 'app/app.module'
import { nullObjectId, sleep } from 'common'
import { createHttpTestContext, HttpClient, HttpTestContext } from 'common/test'
import { createCredentials, Credentials } from './customers-auth.fixture'
import { Config } from 'config'

describe('customer authentication', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let credentials: Credentials

    beforeEach(async () => {
        Config.auth = {
            accessSecret: 'mockAccessSecret',
            accessTokenExpiration: '3s',
            refreshSecret: 'mockRefreshSecret',
            refreshTokenExpiration: '3s'
        }

        testContext = await createHttpTestContext({ imports: [AppModule] })
        client = testContext.client
        credentials = await createCredentials(client)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /login', () => {
        it('should return CREATED(201) status and AuthTokens on successful login', async () => {
            const res = await client.post('/customers/login').body(credentials).created()

            expect(res.body).toEqual({
                accessToken: expect.anything(),
                refreshToken: expect.anything()
            })
        })

        it('should return UNAUTHORIZED(401) status when providing an incorrect password', async () => {
            return client
                .post('/customers/login')
                .body({ email: credentials.email, password: 'wrong password' })
                .unauthorized()
        })

        it('should return UNAUTHORIZED(401) status when providing a non-existent email', async () => {
            return client
                .post('/customers/login')
                .body({ email: 'unknown@mail.com', password: '' })
                .unauthorized()
        })
    })

    describe('POST /refresh', () => {
        let accessToken: string
        let refreshToken: string

        beforeEach(async () => {
            const { body } = await client.post('/customers/login').body(credentials).created()
            accessToken = body.accessToken
            refreshToken = body.refreshToken
        })

        it('should return new AuthTokens when providing a valid refreshToken', async () => {
            const { body } = await client
                .post('/customers/refresh')
                .body({ refreshToken })
                .created()

            expect(body.accessToken).not.toEqual(accessToken)
            expect(body.refreshToken).not.toEqual(refreshToken)
        })

        it('should return UNAUTHORIZED(401) status when providing an incorrect refreshToken', async () => {
            return client
                .post('/customers/refresh')
                .body({ refreshToken: 'invalid-token' })
                .unauthorized()
        })

        it('should return UNAUTHORIZED(401) status when providing an expired refreshToken', async () => {
            await sleep(3500)

            return client.post('/customers/refresh').body({ refreshToken }).unauthorized()
        })
    })

    describe('JWT Authentication', () => {
        let accessToken: string

        beforeEach(async () => {
            const { body } = await client.post('/customers/login').body(credentials).created()
            accessToken = body.accessToken
        })

        it('should allow access when providing a valid accessToken', async () => {
            await client
                .get(`/customers/${credentials.customerId}`)
                .headers({ Authorization: `Bearer ${accessToken}` })
                .ok()
        })

        it('should return UNAUTHORIZED(401) status when providing an accessToken with an incorrect format', async () => {
            return client
                .get(`/customers/${credentials.customerId}`)
                .headers({ Authorization: 'Bearer invalid_access_token' })
                .unauthorized()
        })

        it('should return UNAUTHORIZED(401) status when providing an accessToken containing incorrect data', async () => {
            const jwtService = new JwtService()

            const wrongUserIdToken = jwtService.sign(
                { userId: nullObjectId },
                { secret: 'mockAccessSecret', expiresIn: '15m' }
            )

            return client
                .get(`/customers/${credentials.customerId}`)
                .headers({ Authorization: `Bearer ${wrongUserIdToken}` })
                .unauthorized()
        })
    })
})

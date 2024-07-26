import { JwtService } from '@nestjs/jwt'
import { CustomersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule, CustomersService } from 'app/services/customers'
import { nullObjectId, sleep } from 'common'
import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'

export interface Credentials {
    customerId: string
    email: string
    password: string
}

export async function createCustomer(customersService: CustomersService): Promise<Credentials> {
    const creationDto = {
        name: 'customer name',
        email: 'user@mail.com',
        birthday: new Date('1999-12-12'),
        password: 'password'
    }

    const customer = await customersService.createCustomer(creationDto)

    const { email, password } = creationDto

    return { customerId: customer.id, email, password }
}

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

describe('/customers', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let jwtService: JwtService
    let credentials: Credentials

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, CustomersModule],
            controllers: [CustomersController]
        })
        req = testContext.createRequest('/customers')

        const module = testContext.module

        jwtService = module.get(JwtService)

        const usersService = module.get(CustomersService)
        credentials = await createCustomer(usersService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /login', () => {
        it('Returns CREATED(201) status and AuthTokens on successful login', async () => {
            const res = await req.post('/login').body(credentials).created()

            expect(res.body).toEqual({
                accessToken: expect.anything(),
                refreshToken: expect.anything()
            })
        })

        it('Returns UNAUTHORIZED(401) status when providing an incorrect password', async () => {
            return req
                .post('/login')
                .body({ email: credentials.email, password: 'wrong password' })
                .unauthorized()
        })

        it('Returns UNAUTHORIZED(401) status when providing a non-existent email', async () => {
            return req
                .post('/login')
                .body({ email: 'unknown@mail.com', password: '' })
                .unauthorized()
        })
    })

    describe('POST /refresh', () => {
        let accessToken: string
        let refreshToken: string

        beforeEach(async () => {
            const { body } = await req.post('/login').body(credentials).created()
            accessToken = body.accessToken
            refreshToken = body.refreshToken
        })

        it('Returns a new AuthTokens when providing a valid refreshToken', async () => {
            const { body } = await req.post('/refresh').body({ refreshToken }).created()

            expect(body.accessToken).not.toEqual(accessToken)
            expect(body.refreshToken).not.toEqual(refreshToken)
        })

        it('Returns UNAUTHORIZED(401) status when providing an incorrect refreshToken', async () => {
            return req.post('/refresh').body({ refreshToken: 'invalid-token' }).unauthorized()
        })

        it('Returns UNAUTHORIZED(401) status when providing an expired refreshToken', async () => {
            await sleep(3500)

            return req.post('/refresh').body({ refreshToken }).unauthorized()
        })
    })

    describe('JWT', () => {
        let accessToken: string

        beforeEach(async () => {
            const { body } = await req.post('/login').body(credentials).created()
            accessToken = body.accessToken
        })

        it('Allows access when providing a valid accessToken', async () => {
            await req
                .get(credentials.customerId)
                .headers({ Authorization: `Bearer ${accessToken}` })
                .ok()
        })

        it('Returns UNAUTHORIZED(401) status when providing an accessToken with an incorrect format', async () => {
            return req
                .get(credentials.customerId)
                .headers({ Authorization: 'Bearer invalid_access_token' })
                .unauthorized()
        })

        it('Returns UNAUTHORIZED(401) status when providing an accessToken containing incorrect data', async () => {
            const wrongUserIdToken = jwtService.sign(
                { userId: nullObjectId },
                { secret: 'mockAccessSecret', expiresIn: '15m' }
            )

            return req
                .get(credentials.customerId)
                .headers({ Authorization: `Bearer ${wrongUserIdToken}` })
                .unauthorized()
        })
    })
})

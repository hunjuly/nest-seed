import { HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppModule } from 'app/app.module'
import { createHttpTestEnv, nullUUID, sleep } from 'common'
import { LoginCredentials, prepareUserCredentials as prepareLoginCredentials } from './authentication.fixture'

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
    let sut: any
    let req: any
    let jwtService: JwtService
    let login: LoginCredentials

    beforeEach(async () => {
        sut = await createHttpTestEnv({
            imports: [AppModule]
        })

        req = sut.request
        jwtService = sut.module.get(JwtService)
        login = await prepareLoginCredentials(req)
    })

    afterEach(async () => {
        if (sut) await sut.close()
    })

    it('should be defined', () => {
        expect(sut).toBeDefined()
    })

    describe('POST /auth/login', () => {
        it('로그인 성공시 CREATED(201)과 TokenPair 반환', async () => {
            const res = await req.post({
                url: '/auth/login',
                body: {
                    email: login.email,
                    password: login.password
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                accessToken: expect.anything(),
                refreshToken: expect.anything()
            })
        })

        it('비밀번호가 틀리면 UNAUTHORIZED(401) 반환한다', async () => {
            const res = await req.post({
                url: '/auth/login',
                body: {
                    email: login.email,
                    password: 'wrong password'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
        })

        it('email이 존재하지 않으면 UNAUTHORIZED(401) 반환한다', async () => {
            const res = await req.post({
                url: '/auth/login',
                body: {
                    email: 'unknown@mail.com',
                    password: login.password
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
        })
    })

    describe('로그인 상태에서 작업', () => {
        let accessToken: any
        let refreshToken: any

        beforeEach(async () => {
            const res = await req.post({
                url: '/auth/login',
                body: {
                    email: login.email,
                    password: login.password
                },
                status: HttpStatus.CREATED
            })

            accessToken = res.body.accessToken
            refreshToken = res.body.refreshToken
        })

        describe('POST /auth/refresh', () => {
            it('새로운 TokenPair를 반환한다', async () => {
                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body.accessToken).not.toEqual(accessToken)
                expect(res.body.refreshToken).not.toEqual(refreshToken)
            })

            it('잘못된 refreshToken은 Unauthorized(401) 반환한다', async () => {
                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken: 'invalid-token' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('refreshToken이 만료된 후 refresh 하면 UNAUTHORIZED(401)', async () => {
                await sleep(1500)

                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })

        describe('JwtAuthGuard', () => {
            it('accessToken이 필요하다', async () => {
                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('형식이 잘못된 accessToken은 Unauthorized(401) 반환한다', async () => {
                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer invalid_access_token`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('데이터가 잘못된 accessToken은 Unauthorized(401) 반환한다', async () => {
                const wrongUserIdToken = jwtService.sign(
                    { userId: nullUUID },
                    { secret: 'mockAccessSecret', expiresIn: '15m' }
                )

                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer ${wrongUserIdToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })
    })
})

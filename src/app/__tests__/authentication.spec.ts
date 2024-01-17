import { HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AppModule } from 'app/app.module'
import { nullUUID, sleep } from 'common'
import { LoginCredentials, prepareUserCredentials as prepareLoginCredentials } from './authentication.fixture'
import { HttpTestEnv, createHttpTestEnv } from 'common/test'

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
    let sut: HttpTestEnv
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

    describe('비로그인 상태에서 작업', () => {
        describe('POST /auth/login', () => {
            it('정상 로그인 시 CREATED(201) 상태와 TokenPair 반환', async () => {
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

            it('잘못된 비밀번호 제공 시 UNAUTHORIZED(401) 상태 반환', async () => {
                const res = await req.post({
                    url: '/auth/login',
                    body: {
                        email: login.email,
                        password: 'wrong password'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('존재하지 않는 email 제공 시 UNAUTHORIZED(401) 상태 반환', async () => {
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
    })
    describe('로그인 상태에서 작업', () => {
        let accessToken: any
        let refreshToken: any

        beforeEach(async () => {
            const res = await req.post({
                url: '/auth/login',
                body: login
            })

            accessToken = res.body.accessToken
            refreshToken = res.body.refreshToken
        })

        describe('POST /auth/refresh', () => {
            it('유효한 refreshToken 제공 시 새로운 TokenPair를 반환', async () => {
                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body.accessToken).not.toEqual(accessToken)
                expect(res.body.refreshToken).not.toEqual(refreshToken)
            })

            it('잘못된 refreshToken 제공 시 UNAUTHORIZED(401) 상태 반환', async () => {
                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken: 'invalid-token' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('만료된 refreshToken 제공 시 UNAUTHORIZED(401) 상태 반환', async () => {
                await sleep(1500)

                const res = await req.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })

        describe('JwtAuthGuard', () => {
            it('유효한 accessToken 제공 시 접근 허용', async () => {
                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('형식에 맞지 않는 accessToken 제공 시 UNAUTHORIZED(401) 상태 반환', async () => {
                const res = await req.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer invalid_access_token`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('잘못된 데이터가 포함된 accessToken 제공 시 UNAUTHORIZED(401) 상태 반환', async () => {
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

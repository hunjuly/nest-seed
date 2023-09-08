import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { sleep } from 'src/common'
import { createHttpTestModule, nullUUID } from 'src/common/test'
import { ControllersModule } from '../controllers.module'
import { createUserDto } from './user.mocks'
import { JwtService } from '@nestjs/jwt'

jest.mock('../authentication/services/auth-config.service', () => {
    return {
        AuthConfigService: jest.fn().mockImplementation(() => ({
            accessSecret: 'mockAccessSecret',
            accessTokenExpiration: '1s',
            refreshSecret: 'mockRefreshSecret',
            refreshTokenExpiration: '1s'
        }))
    }
})

describe('User Authentication', () => {
    let module: TestingModule
    let request: any
    let jwtService: JwtService

    beforeEach(async () => {
        const sut = await createHttpTestModule({
            imports: [ControllersModule]
        })

        module = sut.module
        request = sut.request
        jwtService = module.get(JwtService)

        await request.post({
            url: '/users',
            body: createUserDto,
            status: HttpStatus.CREATED
        })
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    describe('POST /auth/login', () => {
        it('로그인 성공시 CREATED(201)과 TokenPair 반환', async () => {
            const res = await request.post({
                url: '/auth/login',
                body: {
                    email: createUserDto.email,
                    password: createUserDto.password
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body.accessToken).toBeDefined()
            expect(res.body.refreshToken).toBeDefined()
        })

        it('비밀번호가 틀리면 UNAUTHORIZED(401) 반환한다', async () => {
            const res = await request.post({
                url: '/auth/login',
                body: {
                    email: createUserDto.email,
                    password: 'wrong password'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
        })

        it('email이 존재하지 않으면 UNAUTHORIZED(401) 반환한다', async () => {
            const res = await request.post({
                url: '/auth/login',
                body: {
                    email: 'unknown@mail.com',
                    password: createUserDto.password
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
        })
    })

    describe('로그인 상태에서 작업', () => {
        let accessToken: any
        let refreshToken: any

        beforeEach(async () => {
            const res = await request.post({
                url: '/auth/login',
                body: {
                    email: createUserDto.email,
                    password: createUserDto.password
                },
                status: HttpStatus.CREATED
            })

            accessToken = res.body.accessToken
            refreshToken = res.body.refreshToken
        })

        describe('POST /auth/refresh', () => {
            it('새로운 TokenPair를 반환한다', async () => {
                const res = await request.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body.accessToken).not.toEqual(accessToken)
                expect(res.body.refreshToken).not.toEqual(refreshToken)
            })

            it('잘못된 refreshToken은 Unauthorized(401) 반환한다', async () => {
                const res = await request.post({
                    url: '/auth/refresh',
                    body: { refreshToken: 'invalid-token' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('refreshToken이 만료된 후 refresh 하면 UNAUTHORIZED(401)', async () => {
                await sleep(1500)

                const res = await request.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })

        describe('JwtAuthGuard', () => {
            it('accessToken이 필요하다', async () => {
                const res = await request.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('형식이 잘못된 accessToken은 Unauthorized(401) 반환한다', async () => {
                const res = await request.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer invalid_access_token`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('데이터가 잘못된 accessToken은 Unauthorized(401) 반환한다', async () => {
                const invalidToken = jwtService.sign(
                    { userId: nullUUID },
                    { secret: 'mockAccessSecret', expiresIn: '15m' }
                )

                const res = await request.get({
                    url: `/auth/jwt-testing`,
                    headers: {
                        Authorization: `Bearer ${invalidToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })
    })
})

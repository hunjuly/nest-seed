import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import * as jwt from 'jsonwebtoken'
import { createHttpTestModule, nullUUID } from 'src/common/test'
import { GlobalModule } from 'src/global'
import { createUserDto } from 'src/users/__tests__'
import { AuthModule } from '../auth.module'
import { AuthConfigService } from '../services'

describe('AuthController (e2e)', () => {
    let request: any

    let config: AuthConfigService
    let module: TestingModule

    beforeEach(async () => {
        const sut = await createHttpTestModule({
            imports: [GlobalModule, AuthModule]
        })

        module = sut.module
        request = sut.request
        config = module.get(AuthConfigService)

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
        it('로그인 성공시 201(Created) 상태와 토큰 반환', async () => {
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

        it('잘못된 비밀번호로 로그인을 시도하면 401 오류를 반환합니다', async () => {
            const res = await request.post({
                url: '/auth/login',
                body: {
                    email: createUserDto.email,
                    password: 'wrong password'
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
        })

        it('존재하지 않는 email로 로그인을 시도하면 401 오류를 반환합니다', async () => {
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

        describe('GET /auth/profile', () => {
            it('유효한 accessToken으로 프로필을 요청하면 200 상태를 반환합니다', async () => {
                const res = await request.get({
                    url: '/auth/profile',
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('존재하지 않는 userId의 accessToken으로 프로필을 요청하면 Unauthorized(401) 오류를 반환합니다', async () => {
                const invalidToken = jwt.sign({ userId: nullUUID }, config.accessSecret, {
                    expiresIn: '15m'
                })

                const res = await request.get({
                    url: '/auth/profile',
                    headers: {
                        Authorization: `Bearer ${invalidToken}`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })

            it('잘못된 accessToken으로 프로필을 요청하면 Unauthorized(401) 오류를 반환합니다', async () => {
                const res = await request.get({
                    url: '/auth/profile',
                    headers: {
                        Authorization: `Bearer invalid_access_token`
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })

        describe('POST /auth/refresh', () => {
            it('유효한 리프레시 토큰으로 토큰 새로고침을 요청하면 새로운 액세스와 리프레시 토큰을 반환합니다', async () => {
                const res = await request.post({
                    url: '/auth/refresh',
                    body: { refreshToken }
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body.accessToken).not.toEqual(accessToken)
                expect(res.body.refreshToken).not.toEqual(refreshToken)
            })

            it('잘못된 리프레시 토큰으로 토큰 새로고침을 요청하면 Unauthorized(401) 오류를 반환합니다', async () => {
                const res = await request.post({
                    url: '/auth/refresh',
                    body: { refreshToken: 'invalid-token' }
                })

                expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
            })
        })
    })
})

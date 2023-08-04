import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { JwtAuthGuard, LocalAuthGuard } from 'src/auth/guards'
import { createHttpTestModule, nullUUID } from 'src/common/test'
import { GlobalModule } from 'src/global'
import { User } from '../entities'
import { UsersModule } from '../users.module'
import { UsersService } from '../users.service'
import { createUserDto, createUserDtos, createdUser, createdUsers } from './users.test-utils'

describe('UsersModule', () => {
    let module: TestingModule
    let request: any
    let service: UsersService

    beforeEach(async () => {
        const sut = await createHttpTestModule({
            imports: [GlobalModule, UsersModule],
            bypassGuards: [LocalAuthGuard, JwtAuthGuard]
        })

        module = sut.module
        request = sut.request

        service = module.get(UsersService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
        expect(service).toBeDefined()
    })

    describe('POST /users', () => {
        it('새로운 user를 생성합니다', async () => {
            const res = await request.post({
                url: '/users',
                body: createUserDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toMatchObject(createdUser)
        })

        it('필수 항목이 누락되었을 때 400(Bad request)을 반환합니다', async () => {
            const res = await request.post({
                url: '/users',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('GET /users', () => {
        beforeEach(async () => {
            for (const createDto of createUserDtos) {
                await request.post({
                    url: '/users',
                    body: createDto,
                    status: HttpStatus.CREATED
                })
            }
        })

        it('검색으로 user를 반환합니다', async () => {
            const res = await request.get({
                url: '/users',
                query: {
                    email: createUserDtos[0].email
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toMatchObject([createdUsers[0]])
        })

        it('기본 옵션으로 user를 반환합니다', async () => {
            const res = await request.get({
                url: '/users'
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toMatchObject(createdUsers)
        })
    })

    describe('특정 user에 대한 작업', () => {
        let user: User

        beforeEach(async () => {
            const res = await request.post({
                url: '/users',
                body: createUserDto,
                status: HttpStatus.CREATED
            })

            user = res.body
        })

        it('user 유효해야 한다.', () => {
            expect(user.id).toBeDefined()
        })

        it('이미 존재하는 email로 user 생성을 하면 CONFLICT(409) 반환한다', async () => {
            const res = await request.post({
                url: '/users',
                body: createUserDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        describe('GET /users/:id', () => {
            it('주어진 id로 user를 반환합니다', async () => {
                const res = await request.get({
                    url: `/users/${user.id}`
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toMatchObject(user)
            })

            it('user를 찾지 못한 경우 404 에러를 반환합니다', async () => {
                const res = await request.get({
                    url: `/users/${nullUUID}`
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('PATCH /users/:id', () => {
            it('주어진 id로 user를 업데이트합니다', async () => {
                const updateInfo = { email: 'new@mail.com' }

                const res = await request.patch({
                    url: `/users/${user.id}`,
                    body: updateInfo
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({ ...user, ...updateInfo })
            })

            it('잘못된 업데이트 항목은 400 오류를 반환합니다.', async () => {
                const res = await request.patch({
                    url: `/users/${user.id}`,
                    body: {
                        wrong: '.'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('user를 찾지 못한 경우 404 에러를 반환합니다', async () => {
                const res = await request.patch({
                    url: `/users/${nullUUID}`,
                    body: {
                        email: 'user@mail.com'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /users/:id', () => {
            it('주어진 id로 user를 삭제합니다', async () => {
                const res = await request.delete({
                    url: `/users/${user.id}`
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('user를 찾지 못한 경우 404 에러를 반환합니다', async () => {
                const res = await request.delete({
                    url: `/users/${nullUUID}`
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('UsersService', () => {
        const password = 'testpassword'
        const email = 'testuser@example.com'

        let user: User

        beforeEach(async () => {
            const createDto = {
                username: 'test username',
                email,
                password,
                firstName: 'Test',
                lastName: 'User',
                birthdate: new Date('1990-01-01')
            }

            user = await service.createUser(createDto)
        })

        describe('findUserByEmail', () => {
            it('주어진 이메일을 가진 사용자가 없으면 null을 반환해야 합니다', async () => {
                const result = await service.findUserByEmail('nonexistentuser@example.com')

                expect(result).toBeNull()
            })

            it('이메일로 사용자를 반환해야 합니다', async () => {
                const foundUser = await service.findUserByEmail(email)

                expect(foundUser).toMatchObject(user)
            })
        })

        describe('validateUser', () => {
            it('비밀번호가 잘못되었을 때 false를 반환해야 합니다', async () => {
                const invalidPassword = 'invalidpassword'
                const valid = await service.validateUser(invalidPassword, user.password)

                expect(valid).toBeFalsy()
            })

            it('비밀번호가 유효하면 true를 반환해야 합니다', async () => {
                const valid = await service.validateUser(password, user.password)

                expect(valid).toBeTruthy()
            })
        })
    })
})

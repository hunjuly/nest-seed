import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { JwtAuthGuard, LocalAuthGuard } from 'app/controllers/guards'
import { UserDto } from 'app/services/users'
import { nullUUID } from 'common'
import { createManyUsers, createUser, userCreationDto } from './users.controller.fixture'
import { HttpTestEnv, createHttpTestEnv } from 'common/test'

describe('UsersController', () => {
    let sut: HttpTestEnv
    let req: any

    const before = async () => {
        sut = await createHttpTestEnv({
            imports: [AppModule],
            bypassGuards: [LocalAuthGuard, JwtAuthGuard]
        })

        req = sut.request
    }

    const after = async () => {
        if (sut) await sut.close()
    }

    describe('UsersController(Creation)', () => {
        beforeEach(before)
        afterEach(after)

        describe('POST /users', () => {
            it('User 생성', async () => {
                const res = await req.post({
                    url: '/users',
                    body: userCreationDto
                })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidUserDto(userCreationDto)
            })

            it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
                const res = await req.post({
                    url: '/users',
                    body: {}
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('이미 존재하는 Email로 User를 생성을 하면 CONFLICT(409)', async () => {
                const createResponse = await req.post({ url: '/users', body: userCreationDto })
                const duplicateCreateResponse = await req.post({ url: '/users', body: userCreationDto })

                expect(createResponse.statusCode).toEqual(HttpStatus.CREATED)
                expect(duplicateCreateResponse.statusCode).toEqual(HttpStatus.CONFLICT)
            })
        })
    })

    describe('UsersController(Modifying)', () => {
        let createdUser: UserDto

        beforeEach(async () => {
            await before()
            createdUser = await createUser(req)
        })
        afterEach(after)

        describe('PATCH /users/:id', () => {
            it('User 업데이트', async () => {
                const res = await req.patch({
                    url: `/users/${createdUser.id}`,
                    body: {
                        email: 'new@mail.com'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...createdUser,
                    email: 'new@mail.com'
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/users/${createdUser.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('User를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: `/users/${nullUUID}`,
                    body: {}
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /users/:id', () => {
            it('User를 삭제한다', async () => {
                const res = await req.delete({
                    url: `/users/${createdUser.id}`
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('User를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: `/users/${nullUUID}`
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('UsersController(Querying)', () => {
        let createdUsers: UserDto[] = []

        beforeAll(async () => {
            await before()
            createdUsers = await createManyUsers(req)
        })
        afterAll(after)

        describe('GET /users', () => {
            it('모든 User를 조회', async () => {
                const res = await req.get({
                    url: '/users',
                    query: {
                        orderby: 'email:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdUsers,
                    total: createdUsers.length
                })
            })

            it('email로 User 조회', async () => {
                const targetUser = createdUsers[0]
                const res = await req.get({
                    url: '/users',
                    query: {
                        email: targetUser.email
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetUser],
                    total: 1
                })
            })
        })

        describe('GET /users/:id', () => {
            it('ID로 User 조회', async () => {
                const targetUser = createdUsers[0]
                const res = await req.get({
                    url: `/users/${targetUser.id}`
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(targetUser)
            })

            it('존재하지 않는 ID로 조회 시 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: `/users/${nullUUID}`
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

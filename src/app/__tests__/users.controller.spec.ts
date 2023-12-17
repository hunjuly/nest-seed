import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppModule } from 'app/app.module'
import { JwtAuthGuard, LocalAuthGuard } from 'app/controllers/guards'
import { UserDto } from 'app/services/users'
import { createHttpTestingModule, defaultUUID } from 'common'
import { createUserDto, createUserDtos, createdUser } from './mocks'

describe('UsersController', () => {
    let module: TestingModule
    let request: any

    beforeEach(async () => {
        const sut = await createHttpTestingModule({
            imports: [AppModule],
            bypassGuards: [LocalAuthGuard, JwtAuthGuard]
        })

        module = sut.module
        request = sut.request
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    describe('POST /users', () => {
        it('새로운 user를 생성한다', async () => {
            const res = await request.post({
                url: '/users',
                body: createUserDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual(createdUser)
        })

        it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
            const res = await request.post({
                url: '/users',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('GET /users', () => {
        let createdUsers: UserDto[] = []

        beforeEach(async () => {
            createdUsers = []

            for (const createDto of createUserDtos) {
                const res = await request.post({
                    url: '/users',
                    body: createDto,
                    status: HttpStatus.CREATED
                })

                createdUsers.push(res.body)
            }
        })

        it('모든 user를 반환한다', async () => {
            const res = await request.get({
                url: '/users'
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(createdUsers)
        })

        it('email로 user를 검색한다', async () => {
            const res = await request.get({
                url: '/users',
                query: {
                    email: createUserDtos[0].email
                }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([createdUsers[0]])
        })
    })

    describe('특정 user에 대한 작업', () => {
        let user: UserDto

        beforeEach(async () => {
            const res = await request.post({
                url: '/users',
                body: createUserDto,
                status: HttpStatus.CREATED
            })

            user = res.body
        })

        it('should be defined', () => {
            expect(user.id).toBeDefined()
        })

        it('이미 존재하는 email로 user 생성을 하면 CONFLICT(409)', async () => {
            const res = await request.post({
                url: '/users',
                body: createUserDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        describe('GET /users/:id', () => {
            it('user를 반환한다', async () => {
                const res = await request.get({
                    url: `/users/${user.id}`
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(user)
                expect(res.body.password).toBeUndefined()
            })

            it('user를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.get({
                    url: `/users/${defaultUUID}`
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('PATCH /users/:id', () => {
            it('user를 업데이트한다', async () => {
                const updateInfo = { email: 'new@mail.com' }

                const res = await request.patch({
                    url: `/users/${user.id}`,
                    body: updateInfo
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({ ...user, ...updateInfo })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await request.patch({
                    url: `/users/${user.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('user를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.patch({
                    url: `/users/${defaultUUID}`,
                    body: {
                        email: 'user@mail.com'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /users/:id', () => {
            it('user를 삭제한다', async () => {
                const res = await request.delete({
                    url: `/users/${user.id}`
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
            })

            it('user를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await request.delete({
                    url: `/users/${defaultUUID}`
                })

                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})

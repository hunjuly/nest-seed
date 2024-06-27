import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { JwtAuthGuard, LocalAuthGuard, UsersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { UserDto, UsersModule, UsersService } from 'app/services/users'
import { nullUUID } from 'common'
import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { createUserDto, createUsers } from './users.fixture'

describe('/users', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let usersService: UsersService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, UsersModule],
            controllers: [UsersController],
            ignoreGuards: [LocalAuthGuard, JwtAuthGuard]
        })

        req = testContext.request

        usersService = testContext.module.get(UsersService)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    describe('POST /users', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Create a user', async () => {
            const res = await req.post({
                url: '/users',
                body: createUserDto
            })

            const { password: _, ...rest } = createUserDto

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...rest
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/users',
                body: { ...createUserDto, email: user.email }
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/users',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /users/:id', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Update a user', async () => {
            const updateResponse = await req.patch({
                url: `/users/${user.id}`,
                body: { email: 'new@mail.com' }
            })

            const getResponse = await req.get({ url: `/users/${user.id}` })

            expect(updateResponse.status).toEqual(HttpStatus.OK)
            expect(updateResponse.body).toEqual({ ...user, email: 'new@mail.com' })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if user is not found', async () => {
            const res = await req.patch({
                url: `/users/${nullUUID}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /users/:id', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Delete a user', async () => {
            const deleteResponse = await req.delete({ url: `/users/${user.id}` })
            const getResponse = await req.get({ url: `/users/${user.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if user is not found', async () => {
            const res = await req.delete({ url: `/users/${nullUUID}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /users', () => {
        let users: UserDto[]
        let user: UserDto

        beforeEach(async () => {
            users = await createUsers(usersService, 10)
            user = users[0]
        })

        it('Retrieve all users', async () => {
            const res = await req.get({
                url: '/users',
                query: { orderby: 'email:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(users)
        })

        it('Retrieve users by email', async () => {
            const res = await req.get({
                url: '/users',
                query: { email: user.email }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([user])
        })
    })

    describe('GET /users/:id', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Retrieve a user by ID', async () => {
            const res = await req.get({ url: `/users/${user.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(user)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/users/${nullUUID}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })
})

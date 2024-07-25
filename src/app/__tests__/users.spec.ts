import { expect } from '@jest/globals'
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

        req = testContext.createRequest()

        usersService = testContext.module.get(UsersService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /users', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Create a user', async () => {
            const res = await req.post('/users').body(createUserDto).created()

            const { password: _, ...rest } = createUserDto
            expect(res.body).toEqual({ id: expect.anything(), ...rest })
        })

        it('CONFLICT(409) if email already exists', async () => {
            return req
                .post('/users')
                .body({ ...createUserDto, email: user.email })
                .conflict()
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            return req.post('/users').body({}).badRequest()
        })
    })

    describe('PATCH /users/:id', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Update a user', async () => {
            const updateResponse = await req
                .patch(`/users/${user.id}`)
                .body({ email: 'new@mail.com' })
                .ok()
            expect(updateResponse.body).toEqual({ ...user, email: 'new@mail.com' })

            const getResponse = await req.get(`/users/${user.id}`).ok()
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if user is not found', async () => {
            return req.patch(`/users/${nullUUID}`).body({}).notFound()
        })
    })

    describe('DELETE /users/:id', () => {
        let user: UserDto

        beforeEach(async () => {
            const users = await createUsers(usersService, 1)
            user = users[0]
        })

        it('Delete a user', async () => {
            await req.delete(`/users/${user.id}`).ok()
            await req.get(`/users/${user.id}`).notFound()
        })

        it('NOT_FOUND(404) if user is not found', async () => {
            return req.delete(`/users/${nullUUID}`).notFound()
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
            const res = await req.get('/users').query({ orderby: 'email:asc' }).ok()

            expect(res.body.items).toEqual(users)
        })

        it('Retrieve users by email', async () => {
            const res = await req.get('/users').query({ email: user.email }).ok()

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
            const res = await req.get(`/users/${user.id}`).ok()

            expect(res.body).toEqual(user)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            return req.get(`/users/${nullUUID}`).notFound()
        })
    })
})

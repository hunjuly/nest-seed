import { UserDto } from 'app/services/users'
import { objToJson } from 'common/test'
import { padNumber } from 'common'

export const userCreationDto = {
    email: 'user@mail.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    birthdate: new Date('2020-12-12'),
    password: 'password'
}

export async function createUser(request: any): Promise<UserDto> {
    const res = await request.post({
        url: '/users',
        body: userCreationDto
    })

    return res.body
}

export function sortUsers(users: UserDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...users].sort((b, a) => a.email.localeCompare(b.email))
    }

    return [...users].sort((a, b) => a.email.localeCompare(b.email))
}

export async function createManyUsers(request: any): Promise<UserDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/users',
                body: {
                    ...userCreationDto,
                    email: `user_${padNumber(i, 3)}@mail.com`
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortUsers(responses.map((res) => res.body))
}

expect.extend({
    toValidUserDto(received, expected) {
        const { password: _, ...rest } = expected
        const pass = this.equals(received, {
            id: expect.anything(),
            ...objToJson(rest)
        })

        const message = pass ? () => `expected UserDto not to match` : () => `expected UserDto to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidUserDto(expected: any): R
    }
}

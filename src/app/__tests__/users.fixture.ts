import { UserDto } from 'app/services/users'
import { padNumber } from 'common'
import { HttpRequest } from 'common/test'

export const createUserDto = {
    email: 'user@mail.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    birthdate: new Date('2020-12-12'),
    password: 'password'
}

export async function createUsers(req: HttpRequest, count: number): Promise<UserDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)

        const body = {
            email: `user-${tag}@mail.com`,
            username: `Username-${tag}`,
            firstName: `First-${tag}`,
            lastName: `Last-${tag}`,
            birthdate: new Date(2020, 1, i),
            password: 'password'
        }

        const promise = req.post({ url: '/users', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (201 !== responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

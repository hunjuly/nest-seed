import { UserDto, UsersService } from 'app/services/users'
import { padNumber } from 'common'

export const createUserDto = {
    email: 'user@mail.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    birthdate: new Date('2020-12-12'),
    password: 'password'
}

export async function createUsers(usersService: UsersService, count: number): Promise<UserDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)

        const promise = usersService.createUser({
            email: `user-${tag}@mail.com`,
            username: `Username-${tag}`,
            firstName: `First-${tag}`,
            lastName: `Last-${tag}`,
            birthdate: new Date(2020, 1, i),
            password: 'password'
        })

        promises.push(promise)
    }

    const users = await Promise.all(promises)

    return users
}

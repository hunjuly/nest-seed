import { objToJson } from 'common'

export const createUserDto = {
    email: 'user@mail.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    birthdate: new Date('2020-12-12'),
    password: 'password'
}

const { password: _, ...rest } = createUserDto
export const createdUser = { ...objToJson(rest), id: expect.anything() }

export const createUserDtos = [
    { ...createUserDto, email: 'user1@mail.com' },
    { ...createUserDto, email: 'user2@mail.com' },
    { ...createUserDto, email: 'user3@mail.com' }
]

declare module 'expect' {
    interface Matchers<R> {
        toValidUserDto(expected: any): R
    }
}

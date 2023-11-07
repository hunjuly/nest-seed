import { objToJson } from 'common/test'

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

export const createdUsers = createUserDtos.map(({ password: _, ...rest }) => ({
    ...objToJson(rest),
    id: expect.anything()
}))

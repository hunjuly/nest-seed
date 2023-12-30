import { HttpStatus } from '@nestjs/common'

export const createUserDto = {
    email: 'user@mail.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    birthdate: new Date('2020-12-12'),
    password: 'password'
}

export interface LoginCredentials {
    email: string
    password: string
}

export async function prepareUserCredentials(req: any) {
    await req.post({
        url: '/users',
        body: createUserDto,
        status: HttpStatus.CREATED
    })

    const { email, password } = createUserDto
    return { email, password }
}

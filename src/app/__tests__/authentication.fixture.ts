export interface UserCredentials {
    email: string
    password: string
}

export async function createUser(req: any) {
    const createUserDto = {
        email: 'user@mail.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        birthdate: new Date('2020-12-12'),
        password: 'password'
    }

    await req.post({
        url: '/users',
        body: createUserDto
    })

    const { email, password } = createUserDto

    return { email, password }
}

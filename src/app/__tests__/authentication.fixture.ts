import { createUserDto } from './users.controller.fixture'

export interface UserCredentials {
    email: string
    password: string
}

export async function createUser(req: any) {
    await req.post({
        url: '/users',
        body: createUserDto
    })

    const { email, password } = createUserDto

    return { email, password }
}

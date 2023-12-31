import { createUser, userCreationDto } from './users.controller.fixture'

export interface LoginCredentials {
    email: string
    password: string
}

export async function prepareUserCredentials(req: any) {
    await createUser(req)

    const { email, password } = userCreationDto
    return { email, password }
}

import { UsersService } from 'app/services/users'

export interface UserCredentials {
    email: string
    password: string
}

export async function createUser(usersService: UsersService) {
    const createUserDto = {
        email: 'user@mail.com',
        password: 'password',
        username: '.',
        firstName: '.',
        lastName: '.',
        birthdate: new Date()
    }

    await usersService.createUser(createUserDto)

    const { email, password } = createUserDto

    return { email, password }
}

import { User } from '../entities'

export class UserDto {
    id: string
    email: string
    username: string
    firstName: string
    lastName: string
    birthdate: Date

    constructor(user: User) {
        const { id, email, username, firstName, lastName, birthdate } = user

        Object.assign(this, { id, email, username, firstName, lastName, birthdate })
    }
}

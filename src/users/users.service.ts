import { Injectable } from '@nestjs/common'
import { Assert, hashPassword, updateIntersection } from 'src/common'
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from './dto'
import { User } from './entities'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
    constructor(private usersRepository: UsersRepository) {}

    async createUser(createUserDto: CreateUserDto) {
        const { password } = createUserDto

        const hashedPassword = await hashPassword(password)

        const createUser = {
            ...createUserDto,
            password: hashedPassword
        }

        const user = await this.usersRepository.create(createUser)

        return user
    }

    async findUsers(queryDto: UsersQueryDto) {
        const users = await this.usersRepository.find(queryDto)

        return users
    }

    async emailExists(email: string): Promise<boolean> {
        const exists = await this.usersRepository.emailExists(email)

        return exists
    }

    async userExists(userId: string): Promise<boolean> {
        const exists = await this.usersRepository.exist(userId)

        return exists
    }

    async getUser(userId: string): Promise<User> {
        const user = await this.usersRepository.findById(userId)

        Assert.defined(user, `User with ID ${userId} not found`)

        return user as User
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDto) {
        const user = await this.getUser(userId)

        const updatedUser = updateIntersection(user, updateUserDto)

        const savedUser = await this.usersRepository.update(updatedUser)

        Assert.equal(savedUser, updatedUser)

        return savedUser
    }

    async removeUser(userId: string) {
        const user = await this.getUser(userId)

        await this.usersRepository.remove(user)
    }
}

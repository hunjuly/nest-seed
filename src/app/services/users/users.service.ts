import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult, Password } from 'common'
import { CreateUserDto, UpdateUserDto, UserDto, UsersQueryDto } from './dto'
import { User } from './entities'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
    constructor(private usersRepository: UsersRepository) {}

    async createUser(createUserDto: CreateUserDto) {
        const { password } = createUserDto

        const hashedPassword = await Password.hash(password)

        const createUser = {
            ...createUserDto,
            password: hashedPassword
        }

        const user = await this.usersRepository.create(createUser)

        return new UserDto(user)
    }

    async findUsers(queryDto: UsersQueryDto): Promise<PaginationResult<UserDto>> {
        const users = await this.usersRepository.findByQuery(queryDto)

        const items = users.items.map((user) => new UserDto(user))

        return { ...users, items }
    }

    async isCorrectPassword(userId: string, password: string) {
        const user = await this.getUserEntity(userId)

        return Password.validate(password, user.password)
    }

    async findByEmail(email: string): Promise<UserDto | null> {
        const user = await this.usersRepository.findByEmail(email)

        if (user) {
            return new UserDto(user)
        }

        return null
    }

    async emailExists(email: string) {
        const exists = await this.usersRepository.emailExists(email)

        return exists
    }

    async userExists(userId: string) {
        const exists = await this.usersRepository.exist(userId)

        return exists
    }

    async getUser(userId: string) {
        const user = await this.getUserEntity(userId)

        return new UserDto(user)
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDto) {
        const savedUser = await this.usersRepository.update(userId, updateUserDto)

        return new UserDto(savedUser)
    }

    async removeUser(userId: string) {
        await this.usersRepository.remove(userId)
    }

    private async getUserEntity(userId: string) {
        const user = await this.usersRepository.findById(userId)

        Assert.defined(user, `User with ID ${userId} not found`)

        return user as User
    }
}

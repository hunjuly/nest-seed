import { Injectable } from '@nestjs/common'
import { DataErrorException, PaginationOption, PaginationResult, Password } from 'common'
import { CreateUserDto, UpdateUserDto, UserDto, UsersFilterDto } from './dto'
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

    async findPagedUsers(
        filterDto: UsersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<UserDto>> {
        const users = await this.usersRepository.findPagedUsers(filterDto, pagination)

        const items = users.items.map((user) => new UserDto(user))

        return { ...users, items }
    }

    async isCorrectPassword(userId: string, password: string) {
        const user = await this.usersRepository.findById(userId)

        if (!user) {
            throw new DataErrorException(`User with ID ${userId} not found`)
        }

        return Password.validate(password, user.password)
    }

    async findByEmail(email: string): Promise<UserDto | null> {
        const user = await this.usersRepository.findByEmail(email)

        if (user) {
            return new UserDto(user)
        }

        return null
    }

    async userExists(userId: string) {
        const userExists = await this.usersRepository.existsById(userId)

        return userExists
    }

    async getUser(userId: string) {
        const user = await this.usersRepository.findById(userId)

        if (!user) {
            throw new DataErrorException(`User with ID ${userId} not found`)
        }

        return new UserDto(user)
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDto) {
        const savedUser = await this.usersRepository.update(userId, updateUserDto)

        return new UserDto(savedUser)
    }

    async deleteUser(userId: string) {
        await this.usersRepository.deleteById(userId)
    }
}

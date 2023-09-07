import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult, Password, updateIntersection } from 'src/common'
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
        const users = await this.usersRepository.find(queryDto)

        const items = users.items.map((seed) => new UserDto(seed))

        return { ...users, items }
    }

    async emailExists(email: string): Promise<boolean> {
        const exists = await this.usersRepository.emailExists(email)

        return exists
    }

    async userExists(userId: string): Promise<boolean> {
        const exists = await this.usersRepository.exist(userId)

        return exists
    }

    async getUser(userId: string) {
        const user = await this._getUser(userId)

        return new UserDto(user)
    }

    private async _getUser(userId: string) {
        const user = await this.usersRepository.findById(userId)

        Assert.defined(user, `User with ID ${userId} not found`)

        return user as User
    }

    async updateUser(userId: string, updateUserDto: UpdateUserDto) {
        const user = await this._getUser(userId)

        const updateUser = updateIntersection(user, updateUserDto)

        const savedUser = await this.usersRepository.update(updateUser)

        Assert.deepEquals(savedUser, updateUser, 'update 요청과 결과가 다름')

        return new UserDto(savedUser)
    }

    async removeUser(userId: string) {
        const user = await this._getUser(userId)

        await this.usersRepository.remove(user)
    }
}

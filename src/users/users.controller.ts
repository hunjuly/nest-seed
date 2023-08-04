import {
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query
} from '@nestjs/common'
import { UserDto, UsersQueryDto } from './dto'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async findUsers(@Query() query: UsersQueryDto) {
        const users = await this.usersService.findUsers(query)

        const items = users.items.map((seed) => new UserDto(seed))

        return { ...users, items }
    }

    @Get(':userId')
    async getUser(@Param('userId') userId: string) {
        await this.requireUserExists(userId)

        const user = await this.usersService.getUser(userId)

        return new UserDto(user)
    }

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        await this.requireEmailNotExists(createUserDto.email)

        const user = await this.usersService.createUser(createUserDto)

        return new UserDto(user)
    }

    @Patch(':userId')
    async updateUser(@Param('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
        await this.requireUserExists(userId)

        const user = await this.usersService.updateUser(userId, updateUserDto)

        return new UserDto(user)
    }

    @Delete(':userId')
    async removeUser(@Param('userId') userId: string) {
        await this.requireUserExists(userId)

        return this.usersService.removeUser(userId)
    }

    private async requireUserExists(userId: string) {
        const userExists = await this.usersService.userExists(userId)

        if (!userExists) {
            throw new NotFoundException(`User with ID ${userId} not found`)
        }
    }

    private async requireEmailNotExists(email: string) {
        const emailExists = await this.usersService.emailExists(email)

        if (emailExists) {
            throw new ConflictException(`User with email ${email} already exists`)
        }
    }
}

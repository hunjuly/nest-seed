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
    Query,
    UseGuards
} from '@nestjs/common'
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from 'src/users/dto'
import { UsersService } from 'src/users/users.service'
import { JwtAuthGuard, Public } from './authentication/guards'
import { AuthService } from './authentication/services/auth.service'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService, private readonly authService: AuthService) {}

    @Public()
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        await this.requireEmailNotExists(createUserDto.email)

        return this.usersService.createUser(createUserDto)
    }

    @Get()
    async findUsers(@Query() query: UsersQueryDto) {
        return this.usersService.findUsers(query)
    }

    @Get(':userId')
    async getUser(@Param('userId') userId: string) {
        await this.requireUserExists(userId)

        return this.usersService.getUser(userId)
    }

    @Patch(':userId')
    async updateUser(@Param('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
        await this.requireUserExists(userId)

        return this.usersService.updateUser(userId, updateUserDto)
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

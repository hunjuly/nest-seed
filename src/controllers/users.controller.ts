import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreateUserDto, UpdateUserDto, UsersQueryDto, UsersService } from 'src/services'
import { JwtAuthGuard, Public } from './authentication'
import { UniqueEmailGuard, UserExistsGuard } from './guards'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Public()
    @UseGuards(UniqueEmailGuard)
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto)
    }

    @Get()
    async findUsers(@Query() query: UsersQueryDto) {
        return this.usersService.findUsers(query)
    }

    @UseGuards(UserExistsGuard)
    @Get(':userId')
    async getUser(@Param('userId') userId: string) {
        return this.usersService.getUser(userId)
    }

    @UseGuards(UserExistsGuard)
    @Patch(':userId')
    async updateUser(@Param('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateUser(userId, updateUserDto)
    }

    @UseGuards(UserExistsGuard)
    @Delete(':userId')
    async removeUser(@Param('userId') userId: string) {
        return this.usersService.removeUser(userId)
    }
}

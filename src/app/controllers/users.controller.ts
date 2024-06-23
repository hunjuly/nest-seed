import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common'
import { CreateUserDto, UpdateUserDto, UsersFilterDto, UsersService } from 'app/services/users'
import { PaginationOption, PaginationPipe } from 'common'
import { JwtAuthGuard, Public, UserEmailNotExistsGuard, UserExistsGuard } from './guards'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Public()
    @UseGuards(UserEmailNotExistsGuard)
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedUsers(@Query() filter: UsersFilterDto, @Query() pagination: PaginationOption) {
        return this.usersService.findPagedUsers(filter, pagination)
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
    async deleteUser(@Param('userId') userId: string) {
        return this.usersService.deleteUser(userId)
    }
}

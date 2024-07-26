import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import { UserCreationDto, UserUpdatingDto, UsersFilterDto, UsersService } from 'app/services/users'
import { PaginationOption, PaginationPipe } from 'common'
import { UserJwtAuthGuard, Public, UserEmailNotExistsGuard, UserExistsGuard } from './guards'

@UseGuards(UserJwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Public()
    @UseGuards(UserEmailNotExistsGuard)
    @Post()
    async createUser(@Body() createUserDto: UserCreationDto) {
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
    async updateUser(@Param('userId') userId: string, @Body() updateUserDto: UserUpdatingDto) {
        return this.usersService.updateUser(userId, updateUserDto)
    }

    @UseGuards(UserExistsGuard)
    @Delete(':userId')
    async deleteUser(@Param('userId') userId: string) {
        return this.usersService.deleteUser(userId)
    }
}

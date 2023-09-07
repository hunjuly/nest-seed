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
    Req,
    UnauthorizedException,
    UseGuards
} from '@nestjs/common'
import { Assert } from 'src/common'
import { AuthService } from 'src/users/auth.service'
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from 'src/users/dto'
import { User } from 'src/users/entities'
import { JwtAuthGuard, LocalAuthGuard } from 'src/users/guards'
import { UsersService } from 'src/users/users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService, private readonly authService: AuthService) {}

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
    @UseGuards(JwtAuthGuard)
    async getUser(@Param('userId') userId: string) {
        await this.requireUserExists(userId)

        return this.usersService.getUser(userId)
    }

    @Patch(':userId')
    @UseGuards(JwtAuthGuard)
    async updateUser(@Param('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
        await this.requireUserExists(userId)

        return this.usersService.updateUser(userId, updateUserDto)
    }

    @Delete(':userId')
    @UseGuards(JwtAuthGuard)
    async removeUser(@Param('userId') userId: string) {
        await this.requireUserExists(userId)

        return this.usersService.removeUser(userId)
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    async login(@Req() req: { user: User }) {
        // 여기로 오는 것은 passport.authenticate('local')을 통과했다는 것
        Assert.defined(req.user, 'login failed. req.user is null.')

        return this.authService.login(req.user)
    }

    @Post('refresh')
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        const payload = await this.authService.refreshTokenPair(refreshToken)

        if (!payload) {
            throw new UnauthorizedException('refresh failed.')
        }

        return payload
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

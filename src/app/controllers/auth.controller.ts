import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { AccessTokenPayload, UserAuthService } from 'app/services/auth'
import { UserDto } from 'app/services/users'
import { Assert } from 'common'
import { UserJwtAuthGuard, UserLocalAuthGuard, Public } from './guards'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: UserAuthService) {}

    @UseGuards(UserLocalAuthGuard)
    @Post('login')
    async login(@Req() req: { user: UserDto }) {
        // req.user is the return value from LocalStrategy.validate
        Assert.defined(req.user, 'req.user must be defined')

        const tokenPair = await this.authService.login(req.user)

        return tokenPair
    }

    @Post('refresh')
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        const tokenPair = await this.authService.refreshAuthTokens(refreshToken)

        if (!tokenPair) {
            throw new UnauthorizedException('refresh failed.')
        }

        return tokenPair
    }

    @UseGuards(UserJwtAuthGuard)
    @Get('jwt-testing')
    async jwtTestring(@Req() _req: { user: AccessTokenPayload }) {}

    @UseGuards(UserJwtAuthGuard)
    @Public()
    @Get('public-testing')
    async publicTesting() {}
}

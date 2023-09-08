import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Assert } from 'src/common'
import { UserDto } from 'src/services'
import { AuthService, JwtAuthGuard, LocalAuthGuard } from './authentication'
import { AccessTokenPayload } from './authentication/interfaces'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req: { user: UserDto }) {
        // req.user는 LocalStrategy.validate의 반환값
        Assert.defined(req.user, 'login failed. req.user is null.')

        const tokenPair = await this.authService.login(req.user)

        return tokenPair
    }

    @Post('refresh')
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        const tokenPair = await this.authService.refreshTokenPair(refreshToken)

        if (!tokenPair) {
            throw new UnauthorizedException('refresh failed.')
        }

        return tokenPair
    }

    @UseGuards(JwtAuthGuard)
    @Get('jwt-testing')
    async jwtTestring(@Req() _req: { user: AccessTokenPayload }) {}
}

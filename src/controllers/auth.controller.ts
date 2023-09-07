import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Assert } from 'src/common'
import { UserDto } from 'src/users/dto'
import { LocalAuthGuard } from './authentication/guards'
import { AuthService } from './authentication/services/auth.service'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req: { user: UserDto }) {
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
}

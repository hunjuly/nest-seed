import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { LogicException } from 'src/common'
import { User } from 'src/users/entities'
import { AuthService } from './auth.service'
import { JwtAuthGuard, LocalAuthGuard } from './guards'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @UseGuards(LocalAuthGuard)
    async login(@Req() req: AuthRequest) {
        // 여기로 오는 것은 passport.authenticate('local')을 통과했다는 것
        // 즉, req.user에는 User가 들어있다.
        if (!req.user) {
            throw new LogicException('login failed. req.user is null.')
        }

        return this.authService.login(req.user)
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@Req() req: AuthRequest) {
        if (!req.user) {
            throw new LogicException('getProfile failed. req.user is null.')
        }

        return req.user
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

interface AuthRequest {
    user: User | null
}

import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { LogicException } from 'src/common'
import { User } from 'src/users/entities'
import { AuthService } from './auth.service'
import { JwtAuthGuard, LocalAuthGuard } from './guards'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @ApiOperation({ summary: '사용자 이름과 비밀번호로 로그인' })
    @ApiResponse({ status: 201, description: '로그인 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
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
    @ApiOperation({ summary: '프로필 정보 가져오기' })
    @ApiResponse({ status: 200, description: '프로필 정보 가져오기 성공', type: User })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiBearerAuth()
    getProfile(@Req() req: AuthRequest) {
        if (!req.user) {
            throw new LogicException('getProfile failed. req.user is null.')
        }

        return req.user
    }

    @Post('refresh')
    @ApiOperation({ summary: '토큰 갱신' })
    @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } })
    @ApiResponse({ status: 201, description: '토큰 갱신 성공' })
    @ApiResponse({ status: 401, description: '갱신 실패' })
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

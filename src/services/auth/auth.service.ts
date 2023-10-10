import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CacheService, comment, convertTimeToSeconds, notUsed } from 'src/common'
import { v4 as uuidv4 } from 'uuid'
import { UserDto, UsersService } from '../users'
import { AuthConfigService } from './auth-config.service'
import { AccessTokenPayload, AuthTokenPair, RefreshTokenPayload } from './interfaces'

const REFRESH_TOKEN_PREFIX = 'refreshToken:'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly config: AuthConfigService,
        private readonly cache: CacheService
    ) {}

    async getUserWithPassword(email: string, password: string): Promise<UserDto | null> {
        const user = await this.usersService.findByEmail(email)

        if (user) {
            const isCorrectPassword = await this.usersService.isCorrectPassword(user.id, password)

            if (isCorrectPassword) {
                return user
            }
        }

        return null
    }

    async login(user: UserDto) {
        return this.generateAuthTokenPair(user.id, user.email)
    }

    async refreshTokenPair(refreshToken: string) {
        const refreshTokenPayload = await this.getRefreshTokenPayload(refreshToken)

        if (refreshTokenPayload) {
            const storedRefreshToken = await this.getStoredRefreshToken(refreshTokenPayload.userId)

            if (storedRefreshToken === refreshToken) {
                return this.generateAuthTokenPair(refreshTokenPayload.userId, refreshTokenPayload.email)
            }
        }

        return null
    }

    private async getRefreshTokenPayload(token: string): Promise<RefreshTokenPayload | undefined> {
        try {
            const secret = this.config.refreshSecret

            const { exp, iat, jti, ...payload } = await this.jwtService.verifyAsync(token, { secret })
            notUsed(exp, iat, jti)

            return payload
        } catch (error) {
            comment('형식에 맞지 않는 토큰이 들어와서 발생하는 예외는 무시한다')
        }

        return undefined
    }

    private async generateAuthTokenPair(userId: string, email: string): Promise<AuthTokenPair> {
        const commonPayload = { userId, email }

        const accessToken = await this.createToken(
            commonPayload,
            this.config.accessSecret,
            this.config.accessTokenExpiration
        )

        const refreshToken = await this.createToken(
            commonPayload,
            this.config.refreshSecret,
            this.config.refreshTokenExpiration
        )

        await this.storeRefreshToken(userId, refreshToken)

        return { accessToken, refreshToken }
    }

    private async createToken(
        payload: AccessTokenPayload | RefreshTokenPayload,
        secret: string,
        expiresIn: string
    ) {
        const token = await this.jwtService.signAsync({ ...payload, jti: uuidv4() }, { secret, expiresIn })

        return token
    }

    private async storeRefreshToken(userId: string, refreshToken: string) {
        const expireTime = convertTimeToSeconds(this.config.refreshTokenExpiration)

        await this.cache.set(`${REFRESH_TOKEN_PREFIX}${userId}`, refreshToken, expireTime * 1000)
    }

    private async getStoredRefreshToken(userId: string): Promise<string | undefined> {
        return this.cache.get(`${REFRESH_TOKEN_PREFIX}${userId}`)
    }
}

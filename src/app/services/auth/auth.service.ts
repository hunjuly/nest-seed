import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserDto, UsersService } from 'app/services/users'
import { CacheService, comment, generateUUID, notUsed } from 'common'
import { authOptions } from 'config'
import { AccessTokenPayload, AuthTokenPair, RefreshTokenPayload } from './interfaces'

const REFRESH_TOKEN_PREFIX = 'refreshToken:'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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
            const secret = authOptions.refreshSecret

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
            authOptions.accessSecret,
            authOptions.accessTokenExpiration
        )

        const refreshToken = await this.createToken(
            commonPayload,
            authOptions.refreshSecret,
            authOptions.refreshTokenExpiration
        )

        await this.storeRefreshToken(userId, refreshToken)

        return { accessToken, refreshToken }
    }

    private async createToken(
        payload: AccessTokenPayload | RefreshTokenPayload,
        secret: string,
        expiresIn: string
    ) {
        const token = await this.jwtService.signAsync(
            { ...payload, jti: generateUUID() },
            { secret, expiresIn }
        )

        return token
    }

    private async storeRefreshToken(userId: string, refreshToken: string) {
        await this.cache.set(
            `${REFRESH_TOKEN_PREFIX}${userId}`,
            refreshToken,
            authOptions.refreshTokenExpiration
        )
    }

    private async getStoredRefreshToken(userId: string): Promise<string | undefined> {
        return this.cache.get(`${REFRESH_TOKEN_PREFIX}${userId}`)
    }
}

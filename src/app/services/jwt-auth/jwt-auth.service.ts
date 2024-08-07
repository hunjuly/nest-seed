import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CacheService, comment, generateUUID, notUsed } from 'common'
import { Config } from 'config'

const REFRESH_TOKEN_PREFIX = 'refreshToken:'

export interface AuthTokenPayload {
    userId: string
    email: string
}

export interface JwtAuthTokens {
    accessToken: string
    refreshToken: string
}

@Injectable()
export class JwtAuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly cache: CacheService
    ) {}

    async generateAuthTokens(userId: string, email: string): Promise<JwtAuthTokens> {
        const commonPayload = { userId, email }

        const accessToken = await this.createToken(
            commonPayload,
            Config.auth.accessSecret,
            Config.auth.accessTokenExpiration
        )

        const refreshToken = await this.createToken(
            commonPayload,
            Config.auth.refreshSecret,
            Config.auth.refreshTokenExpiration
        )

        await this.storeRefreshToken(userId, refreshToken)

        return { accessToken, refreshToken }
    }

    async refreshAuthTokens(refreshToken: string) {
        const refreshTokenPayload = await this.getAuthTokenPayload(refreshToken)

        if (refreshTokenPayload) {
            const storedRefreshToken = await this.getStoredRefreshToken(refreshTokenPayload.userId)

            if (storedRefreshToken === refreshToken) {
                return this.generateAuthTokens(
                    refreshTokenPayload.userId,
                    refreshTokenPayload.email
                )
            }
        }

        return null
    }

    private async getAuthTokenPayload(token: string): Promise<AuthTokenPayload | undefined> {
        try {
            const secret = Config.auth.refreshSecret

            const { exp, iat, jti, ...payload } = await this.jwtService.verifyAsync(token, {
                secret
            })
            notUsed(exp, iat, jti)

            return payload
        } catch (error) {
            comment('Ignore exceptions that are thrown because an unformatted token comes in')
        }

        return undefined
    }

    private async createToken(payload: AuthTokenPayload, secret: string, expiresIn: string) {
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
            Config.auth.refreshTokenExpiration
        )
    }

    private async getStoredRefreshToken(userId: string): Promise<string | undefined> {
        return this.cache.get(`${REFRESH_TOKEN_PREFIX}${userId}`)
    }
}

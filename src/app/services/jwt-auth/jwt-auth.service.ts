import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CacheService, generateUUID, notUsed } from 'common'
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
        const tokenPayload = await this.getAuthTokenPayload(refreshToken)
        const storedRefreshToken = await this.getStoredRefreshToken(tokenPayload.userId)
        if (storedRefreshToken !== refreshToken)
            throw new UnauthorizedException('Refresh token expired. Please log in again.')
        return this.generateAuthTokens(tokenPayload.userId, tokenPayload.email)
    }

    private async getAuthTokenPayload(token: string) {
        try {
            const secret = Config.auth.refreshSecret
            const { exp, iat, jti, ...payload } = await this.jwtService.verifyAsync(token, {
                secret
            })
            notUsed(exp, iat, jti)
            return payload as AuthTokenPayload
        } catch (error) {
            throw new UnauthorizedException('Invalid token. Please log in again.')
        }
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

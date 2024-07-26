import { Injectable, Module } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { CacheService, comment, generateUUID, notUsed } from 'common'
import { Config } from 'config'

const REFRESH_TOKEN_PREFIX = 'refreshToken:'

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

    async refreshAuthTokens(refreshToken: string) {
        const refreshTokenPayload = await this.getRefreshTokenPayload(refreshToken)

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

    async getRefreshTokenPayload(token: string): Promise<any> {
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

    private async createToken(payload: any, secret: string, expiresIn: string) {
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

    async getStoredRefreshToken(userId: string): Promise<string | undefined> {
        return this.cache.get(`${REFRESH_TOKEN_PREFIX}${userId}`)
    }
}

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: Config.auth.accessSecret,
            signOptions: {
                expiresIn: Config.auth.accessTokenExpiration
            }
        }),
        JwtModule.register({
            secret: Config.auth.refreshSecret,
            signOptions: {
                expiresIn: Config.auth.refreshTokenExpiration
            }
        })
    ],
    providers: [JwtAuthService],
    exports: [JwtAuthService]
})
export class JwtAuthModule {}

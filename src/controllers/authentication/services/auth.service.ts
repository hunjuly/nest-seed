import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as jwt from 'jsonwebtoken'
import { CacheService, convertTimeToSeconds, notUsed } from 'src/common'
import { UserDto, UsersService } from 'src/services'
import { v4 as uuidv4 } from 'uuid'
import { JwtPayload, TokenPayload } from '../interfaces'
import { AuthConfigService } from './auth-config.service'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly config: AuthConfigService,
        private readonly cache: CacheService
    ) {}

    async validateUser(email: string, password: string): Promise<{ id: string; email: string } | null> {
        const user = await this.usersService.validateUser(email, password)

        return user
    }

    // login을 한다는 것은 validateUser를 통과했다는 말
    async login(user: UserDto) {
        const { id: userId, email } = user

        const tokenPayload = { userId, email }
        const tokenPair = await this.generateTokenPair(tokenPayload)

        return tokenPair
    }

    async refreshTokenPair(refreshToken: string) {
        const decoded = this.decodeToken(refreshToken, this.config.refreshSecret)

        if (decoded) {
            const { userId } = decoded

            if (userId) {
                const refreshTokenFromStore = await this.getRefreshToken(userId)

                if (refreshTokenFromStore === refreshToken) {
                    const tokenPair = await this.generateTokenPair(decoded)

                    return tokenPair
                }
            }
        }

        return null
    }

    private async generateTokenPair({ userId, email }: TokenPayload) {
        const accessToken = this.jwtService.sign(
            { userId, email, jti: uuidv4() },
            {
                secret: this.config.accessSecret,
                expiresIn: this.config.accessTokenExpiration
            }
        )

        const refreshToken = this.jwtService.sign(
            { userId, email, jti: uuidv4() },
            {
                secret: this.config.refreshSecret,
                expiresIn: this.config.refreshTokenExpiration
            }
        )

        await this.storeRefreshToken(userId, refreshToken)

        return { accessToken, refreshToken }
    }

    private decodeToken(token: string, secret: string) {
        try {
            return jwt.verify(token, secret) as JwtPayload
        } catch (error) {
            notUsed('형식에 맞지 않는 토큰이 들어와서 발생하는 예외는 무시한다')
        }

        return undefined
    }

    private async storeRefreshToken(userId: string, refreshToken: string) {
        const expireTime = convertTimeToSeconds(this.config.refreshTokenExpiration)

        await this.cache.set(`refreshToken:${userId}`, refreshToken, expireTime)
    }

    private async getRefreshToken(userId: string): Promise<string | undefined> {
        return this.cache.get(`refreshToken:${userId}`)
    }
}

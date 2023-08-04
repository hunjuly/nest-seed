import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as jwt from 'jsonwebtoken'
import { CacheService, convertTimeToSeconds, notUsed } from 'src/common'
import { User } from 'src/users/entities'
import { UsersService } from 'src/users/users.service'
import { v4 as uuidv4 } from 'uuid'
import { JwtPayload, TokenPayload } from './interfaces'
import { AuthConfigService } from './services'

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly config: AuthConfigService,
        private readonly cache: CacheService
    ) {}

    async getUser(email: string, password: string): Promise<User | null> {
        const user = await this.usersService.findUserByEmail(email)

        if (user) {
            const valid = await this.usersService.validateUser(password, user.password)

            if (valid) {
                return user
            }
        }

        return null
    }

    // login을 한다는 것은 validateUser를 통과했다는 말
    async login(user: User) {
        const { id: userId, email } = user

        const tokenPayload = { userId, email }

        const tokenPair = await this.generateTokenPair(tokenPayload)

        return tokenPair
    }

    async refreshTokenPair(refreshToken: string) {
        // refreshTokenPair이 실패한다고 해서 internal server 에러는 아니다.
        // 사용자 입력이 잘못된 것이기 때문에 Expect.xxx로 검증하지 않는다.
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

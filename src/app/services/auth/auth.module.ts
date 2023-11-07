import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { GlobalModule } from 'app/global'
import { UsersModule } from '../users'
import { AuthService } from './auth.service'
import { JwtStrategy, LocalStrategy } from './strategies'
import { getAuthOptions as config } from 'config'

function getJwtModuleAsyncOption(tokenType: 'access' | 'refresh') {
    return {
        useFactory: async () => {
            const secret = tokenType === 'access' ? config.accessSecret : config.refreshSecret
            const expiresIn =
                tokenType === 'access' ? config.accessTokenExpiration : config.refreshTokenExpiration

            return {
                secret,
                signOptions: {
                    expiresIn
                }
            }
        }
    }
}

@Module({
    imports: [
        GlobalModule,
        PassportModule,
        UsersModule,
        JwtModule.registerAsync(getJwtModuleAsyncOption('refresh')),
        JwtModule.registerAsync(getJwtModuleAsyncOption('access'))
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService]
})
export class AuthModule {}

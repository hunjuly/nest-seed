import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { SafeConfigService } from 'src/common'
import { GlobalModule } from 'src/global'
import { UsersModule } from '../users'
import { AuthConfigService } from './auth-config.service'
import { AuthService } from './auth.service'
import { JwtStrategy, LocalStrategy } from './strategies'

function getJwtModuleAsyncOption(tokenType: 'access' | 'refresh') {
    return {
        useFactory: async (configsafe: SafeConfigService) => {
            const config = new AuthConfigService(configsafe)

            const secret = tokenType === 'access' ? config.accessSecret : config.refreshSecret
            const expiresIn =
                tokenType === 'access' ? config.accessTokenExpiration : config.refreshTokenExpiration

            return {
                secret,
                signOptions: {
                    expiresIn
                }
            }
        },
        inject: [SafeConfigService]
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
    providers: [AuthService, LocalStrategy, JwtStrategy, AuthConfigService],
    exports: [AuthService]
})
export class AuthModule {}

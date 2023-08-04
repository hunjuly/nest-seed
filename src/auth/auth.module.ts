import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { SafeConfigService } from 'src/common'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthConfigService } from './services'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
    imports: [
        forwardRef(() => UsersModule),
        PassportModule,
        JwtModule.registerAsync({
            useFactory: async (configsafe: SafeConfigService) => {
                const config = new AuthConfigService(configsafe)

                return {
                    secret: config.refreshSecret,
                    signOptions: {
                        expiresIn: config.refreshTokenExpiration
                    }
                }
            },
            inject: [SafeConfigService]
        }),
        JwtModule.registerAsync({
            useFactory: async (configsafe: SafeConfigService) => {
                const config = new AuthConfigService(configsafe)

                return {
                    secret: config.accessSecret,
                    signOptions: {
                        expiresIn: config.accessTokenExpiration
                    }
                }
            },
            inject: [SafeConfigService]
        })
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, AuthConfigService],
    controllers: [AuthController]
})
export class AuthModule {}

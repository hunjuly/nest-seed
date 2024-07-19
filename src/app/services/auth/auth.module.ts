import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { GlobalModule } from 'app/global'
import { UsersModule } from 'app/services/users'
import { Config } from 'config'
import { AuthService } from './auth.service'
import { JwtStrategy, LocalStrategy } from './strategies'

@Module({
    imports: [
        GlobalModule,
        PassportModule,
        UsersModule,
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
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService]
})
export class AuthModule {}

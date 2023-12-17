import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { GlobalModule } from 'app/global'
import { UsersModule } from 'app/services/users'
import { authOptions } from 'config'
import { AuthService } from './auth.service'
import { JwtStrategy, LocalStrategy } from './strategies'

@Module({
    imports: [
        GlobalModule,
        PassportModule,
        UsersModule,
        JwtModule.register({
            secret: authOptions.accessSecret,
            signOptions: {
                expiresIn: authOptions.accessTokenExpiration
            }
        }),
        JwtModule.register({
            secret: authOptions.refreshSecret,
            signOptions: {
                expiresIn: authOptions.refreshTokenExpiration
            }
        })
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService]
})
export class AuthModule {}

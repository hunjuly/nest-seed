import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { GlobalModule } from 'app/global'
import { UsersModule } from '../users'
import { AuthService } from './auth.service'
import { JwtStrategy, LocalStrategy } from './strategies'
import { authOptions } from 'config'

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

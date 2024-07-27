import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Config } from 'config'
import { JwtAuthService } from './jwt-auth.service'

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

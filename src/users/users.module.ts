import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SafeConfigService, TransactionService } from 'src/common'
import { User } from './entities'
import { UsersController } from './users.controller'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthConfigService } from './services'
import { LocalStrategy, JwtStrategy } from './strategies'

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
        TypeOrmModule.forFeature([User]),
        PassportModule,
        JwtModule.registerAsync(getJwtModuleAsyncOption('refresh')),
        JwtModule.registerAsync(getJwtModuleAsyncOption('access'))
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository,
        TransactionService,
        AuthService,
        LocalStrategy,
        JwtStrategy,
        AuthConfigService
    ],
    exports: [UsersService]
})
export class UsersModule {}

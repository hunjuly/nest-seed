import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'
import { JwtAuthService } from 'common'
import { Config } from 'config'
import { CustomersRepository } from './customers.repository'
import { CustomersService } from './customers.service'
import { Customer, CustomerSchema } from './schemas'
import { CustomerJwtStrategy, CustomerLocalStrategy } from './strategies'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
        PassportModule
    ],
    providers: [
        CustomersService,
        CustomersRepository,
        CustomerLocalStrategy,
        CustomerJwtStrategy,
        JwtAuthService,
        {
            provide: 'AuthConfig',
            useValue: {
                accessSecret: Config.auth.accessSecret,
                refreshSecret: Config.auth.refreshSecret,
                accessTokenExpiration: Config.auth.accessTokenExpiration,
                refreshTokenExpiration: Config.auth.refreshTokenExpiration
            }
        }
    ],
    exports: [CustomersService]
})
export class CustomersModule {}

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtAuthService } from 'common'
import { Config } from 'config'
import { CustomersRepository } from './customers.repository'
import { CustomersService } from './customers.service'
import { Customer, CustomerSchema } from './schemas'
import { CustomerJwtStrategy, CustomerLocalStrategy } from './strategies'
import { PassportModule } from '@nestjs/passport'

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
        { provide: 'AuthConfig', useValue: Config.auth }
    ],
    exports: [CustomersService]
})
export class CustomersModule {}

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'
import { JwtAuthService } from 'common'
import { Config } from 'config'
import { CustomersController } from './customers.controller'
import { CustomersRepository } from './customers.repository'
import { CustomersService } from './customers.service'
import { Customer, CustomerSchema } from './schemas'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
        PassportModule
    ],
    providers: [
        CustomersService,
        CustomersRepository,
        JwtAuthService,
        { provide: 'AuthConfig', useFactory: () => Config.auth }
    ],
    exports: [CustomersService],
    controllers: [CustomersController]
})
export class CustomersModule {}

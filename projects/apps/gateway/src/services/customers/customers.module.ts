import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtAuthModule } from '../jwt-auth'
import { CustomersRepository } from './customers.repository'
import { CustomersService } from './customers.service'
import { Customer, CustomerSchema } from './schemas'
import { CustomerJwtStrategy, CustomerLocalStrategy } from './strategies'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
        JwtAuthModule
    ],
    providers: [CustomersService, CustomersRepository, CustomerLocalStrategy, CustomerJwtStrategy],
    exports: [CustomersService]
})
export class CustomersModule {}

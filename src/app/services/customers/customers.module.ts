import { Module } from '@nestjs/common'
import { Customer, CustomerSchema } from './schemas'
import { CustomersRepository } from './customers.repository'
import { CustomersService } from './customers.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }])],
    providers: [CustomersService, CustomersRepository],
    exports: [CustomersService]
})
export class CustomersModule {}

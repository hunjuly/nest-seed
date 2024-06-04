import { Module } from '@nestjs/common'
import { CustomersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule } from './services/customers'

@Module({
    imports: [GlobalModule, CustomersModule],
    controllers: [CustomersController]
})
export class AppModule {}

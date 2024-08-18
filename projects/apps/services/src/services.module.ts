import { Module } from '@nestjs/common'
import { CoreModule } from 'core'
import { CustomersController, CustomersModule } from './customers'

@Module({
    imports: [CoreModule, CustomersModule],
    controllers: [CustomersController]
})
export class ServicesModule {}

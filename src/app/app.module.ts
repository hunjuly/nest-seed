import { Module } from '@nestjs/common'
import { CustomersController, MoviesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule } from './services/customers'
import { MoviesModule } from './services/movies'

@Module({
    imports: [GlobalModule, CustomersModule, MoviesModule],
    controllers: [CustomersController, MoviesController]
})
export class AppModule {}

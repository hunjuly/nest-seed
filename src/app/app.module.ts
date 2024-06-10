import { Module } from '@nestjs/common'
import { AuthController, CustomersController, MoviesController, UsersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from './services/auth'
import { CustomersModule } from './services/customers'
import { MoviesModule } from './services/movies'
import { UsersModule } from './services/users'

@Module({
    imports: [GlobalModule, CustomersModule, MoviesModule, AuthModule, UsersModule],
    controllers: [CustomersController, MoviesController, UsersController, AuthController]
})
export class AppModule {}

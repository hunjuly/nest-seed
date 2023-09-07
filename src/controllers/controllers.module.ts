import { Module } from '@nestjs/common'
import { ADD_DEV } from 'src/common'
import { GlobalModule } from 'src/global'
import { SeedsModule, UsersModule } from 'src/services'
import { AuthController } from './auth.controller'
import { AuthModule } from './authentication/auth.module'
import { FiltersModule } from './modules/filters.module'
import { ValidationModule } from './modules/validation.module'
import { SeedsController } from './seeds.controller'
import { UsersController } from './users.controller'

@Module({
    imports: ADD_DEV([GlobalModule, ValidationModule, FiltersModule, AuthModule, UsersModule], [SeedsModule]),
    controllers: ADD_DEV([UsersController, AuthController], [SeedsController])
})
export class ControllersModule {}

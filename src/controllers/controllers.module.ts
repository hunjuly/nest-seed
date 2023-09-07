import { Module } from '@nestjs/common'
import { SeedsModule } from 'src/_seeds'
import { addItemInDevelopment as ADD_DEV } from 'src/common'
import { GlobalModule } from 'src/global'
import { UsersModule } from 'src/users/users.module'
import { AuthModule } from './authentication/auth.module'
import { FiltersModule } from './modules/filters.module'
import { ValidationModule } from './modules/validation.module'
import { SeedsController } from './seeds.controller'
import { UsersController } from './users.controller'
import { AuthController } from './auth.controller'

@Module({
    imports: ADD_DEV([GlobalModule, ValidationModule, FiltersModule, AuthModule, UsersModule], [SeedsModule]),
    controllers: ADD_DEV([UsersController, AuthController], [SeedsController])
})
export class ControllersModule {}

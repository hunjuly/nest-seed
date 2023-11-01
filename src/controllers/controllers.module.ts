import { Module } from '@nestjs/common'
import { ADD_DEV } from 'src/common'
import { GlobalModule } from 'src/global'
import { AuthModule, PsqlsModule, UsersModule } from 'src/services'
import { AuthController } from './auth.controller'
import { FiltersModule } from './modules/filters.module'
import { ValidationModule } from './modules/validation.module'
import { PsqlsController } from './psqls.controller'
import { UsersController } from './users.controller'

@Module({
    imports: ADD_DEV([GlobalModule, ValidationModule, FiltersModule, AuthModule, UsersModule], [PsqlsModule]),
    controllers: ADD_DEV([UsersController, AuthController], [PsqlsController])
})
export class ControllersModule {}

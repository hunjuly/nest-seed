import { Module } from '@nestjs/common'
import { ADD_DEV } from 'src/common'
import { GlobalModule } from 'src/global'
import { AuthModule, PsqlsModule, UsersModule } from 'src/services'
import { AuthController } from './auth'
import { FiltersModule } from './filters.module'
import { ValidationModule } from './validation.module'
import { PsqlsController } from './psqls'
import { UsersController } from './users'

@Module({
    imports: ADD_DEV([GlobalModule, ValidationModule, FiltersModule, AuthModule, UsersModule], [PsqlsModule]),
    controllers: ADD_DEV([UsersController, AuthController], [PsqlsController])
})
export class ControllersModule {}

import { Module } from '@nestjs/common'
import { ADD_DEV } from 'src/common'
import { GlobalModule } from 'src/global'
import { AuthModule, MongosModule, PsqlsModule, UsersModule } from 'src/services'
import { AuthController } from './auth.controller'
import { FiltersModule } from './modules/filters.module'
import { ValidationModule } from './modules/validation.module'
import { MongosController } from './mongos.controller'
import { PsqlsController } from './psqls.controller'
import { UsersController } from './users.controller'

@Module({
    imports: ADD_DEV(
        [GlobalModule, ValidationModule, FiltersModule, AuthModule, UsersModule],
        [PsqlsModule, MongosModule]
    ),
    controllers: ADD_DEV([UsersController, AuthController], [PsqlsController, MongosController])
})
export class ControllersModule {}

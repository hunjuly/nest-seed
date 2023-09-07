import { Module } from '@nestjs/common'
import { SeedsModule } from 'src/_seeds'
import { addItemInDevelopment } from 'src/common'
import { GlobalModule } from 'src/global'
import { UsersModule } from 'src/users/users.module'
import { AuthModule } from './authentication/auth.module'
import { FiltersModule } from './filters.module'
import { SeedsController } from './seeds.controller'
import { UsersController } from './users.controller'
import { ValidationModule } from './validation.module'

@Module({
    imports: addItemInDevelopment(
        [GlobalModule, ValidationModule, FiltersModule, AuthModule, UsersModule],
        [SeedsModule]
    ),
    controllers: addItemInDevelopment([UsersController], [SeedsController])
})
export class ControllersModule {}

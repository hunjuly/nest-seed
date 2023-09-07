import { Module } from '@nestjs/common'
import { GlobalModule } from 'src/global'
import { UsersModule } from 'src/users/users.module'
import { SeedsModule } from 'src/_seeds'
import { addItemInDevelopment } from 'src/common'
import { SeedsController } from './seeds.controller'
import { UsersController } from './users.controller'

@Module({
    imports: addItemInDevelopment([GlobalModule, UsersModule], [SeedsModule]),
    controllers: addItemInDevelopment([UsersController], [SeedsController])
})
export class ControllersModule {}

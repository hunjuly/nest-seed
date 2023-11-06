import { Module } from '@nestjs/common'
import { ADD_DEV } from 'src/common'
import { PsqlsModule } from './_seeds'
import { AuthModule } from './auth'
import { UsersModule } from './users'

const modules = ADD_DEV([AuthModule, UsersModule], [PsqlsModule])

@Module({
    imports: modules,
    exports: modules
})
export class ServicesModule {}

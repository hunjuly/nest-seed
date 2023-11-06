import { Module } from '@nestjs/common'
import { ADD_DEV } from 'src/common'
import { PsqlsModule } from './_seeds'
import { AuthModule } from './auth'
import { UsersModule } from './users'

@Module({
    imports: ADD_DEV([AuthModule, UsersModule], [PsqlsModule])
})
export class ServicesModule {}

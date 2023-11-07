import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionService } from 'common'
import { User } from './entities'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'
import { GlobalModule } from 'app/global'

@Module({
    imports: [GlobalModule, TypeOrmModule.forFeature([User])],
    providers: [UsersService, UsersRepository, TransactionService],
    exports: [UsersService]
})
export class UsersModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionService } from 'src/common'
import { User } from './entities'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'
import { GlobalModule } from 'src/global'

@Module({
    imports: [GlobalModule, TypeOrmModule.forFeature([User])],
    providers: [UsersService, UsersRepository, TransactionService],
    exports: [UsersService]
})
export class UsersModule {}

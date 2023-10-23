import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Psql } from './entities'
import { PsqlsRepository } from './psqls.repository'
import { PsqlsService } from './psqls.service'
import { GlobalModule } from 'src/global'

@Module({
    imports: [GlobalModule, TypeOrmModule.forFeature([Psql])],
    providers: [PsqlsService, PsqlsRepository],
    exports: [PsqlsService]
})
export class PsqlsModule {}

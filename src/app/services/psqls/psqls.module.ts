import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Psql } from './entities'
import { PsqlsRepository } from './psqls.repository'
import { PsqlsService } from './psqls.service'

@Module({
    imports: [TypeOrmModule.forFeature([Psql])],
    providers: [PsqlsService, PsqlsRepository],
    exports: [PsqlsService]
})
export class PsqlsModule {}

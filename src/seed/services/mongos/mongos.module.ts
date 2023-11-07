import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Mongo } from './entities'
import { MongosService } from './mongos.service'

import { GlobalModule } from 'app/global'
import { MongosRepository } from './mongos.repository'

@Module({
    imports: [GlobalModule, TypeOrmModule.forFeature([Mongo])],
    providers: [MongosService, MongosRepository],
    exports: [MongosService]
})
export class MongosModule {}

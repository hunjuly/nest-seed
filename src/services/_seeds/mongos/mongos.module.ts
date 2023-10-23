import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GlobalModule } from 'src/global'
import { Mongo } from './entities'
import { MongosRepository } from './mongos.repository'
import { MongosService } from './mongos.service'

@Module({
    imports: [GlobalModule, TypeOrmModule.forFeature([Mongo])],
    providers: [MongosService, MongosRepository],
    exports: [MongosService]
})
export class MongosModule {}

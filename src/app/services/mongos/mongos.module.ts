import { Module } from '@nestjs/common'
import { Mongo, MongoSchema } from './schemas'
import { MongosRepository } from './mongos.repository'
import { MongosService } from './mongos.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Mongo.name, schema: MongoSchema }])],
    providers: [MongosService, MongosRepository],
    exports: [MongosService]
})
export class MongosModule {}

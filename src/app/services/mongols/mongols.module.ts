import { Module } from '@nestjs/common'
import { Mongol, MongolSchema } from './schemas'
import { MongolsRepository } from './mongols.repository'
import { MongolsService } from './mongols.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Mongol.name, schema: MongolSchema }])],
    providers: [MongolsService, MongolsRepository],
    exports: [MongolsService]
})
export class MongolsModule {}

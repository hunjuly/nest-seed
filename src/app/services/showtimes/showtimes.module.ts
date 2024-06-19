import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Showtime, ShowtimeSchema } from './schemas'
import { ShowtimesRepository } from './showtimes.repository'
import { ShowtimesService } from './showtimes.service'
import { BullModule } from '@nestjs/bull'
import { ShowtimesCreationService } from './services'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Showtime.name, schema: ShowtimeSchema }]),
        BullModule.registerQueue({ name: 'showtimes' })
    ],
    providers: [ShowtimesService, ShowtimesRepository, ShowtimesCreationService],
    exports: [ShowtimesService]
})
export class ShowtimesModule {}

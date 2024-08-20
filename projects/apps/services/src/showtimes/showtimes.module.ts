import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EventService } from 'common'
import { MoviesModule } from '../movies'
import { TheatersModule } from '../theaters'
import { Showtime, ShowtimeSchema } from './schemas'
import { ShowtimesCreationService } from './services'
import { ShowtimesRepository } from './showtimes.repository'
import { ShowtimesService } from './showtimes.service'
import { ShowtimesController } from './showtimes.controller'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Showtime.name, schema: ShowtimeSchema }]),
        BullModule.registerQueue({ name: 'showtimes' }),
        MoviesModule,
        TheatersModule
    ],
    providers: [ShowtimesService, ShowtimesRepository, ShowtimesCreationService, EventService],
    exports: [ShowtimesService],
    controllers: [ShowtimesController]
})
export class ShowtimesModule {}

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TicketsModule } from '../tickets'
import { Showtime, ShowtimeSchema } from './schemas'
import { ShowtimesRepository } from './showtimes.repository'
import { ShowtimesService } from './showtimes.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: Showtime.name, schema: ShowtimeSchema }]), TicketsModule],
    providers: [ShowtimesService, ShowtimesRepository],
    exports: [ShowtimesService]
})
export class ShowtimesModule {}

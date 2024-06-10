import { Module } from '@nestjs/common'
import { Showtime, ShowtimeSchema } from './schemas'
import { ShowtimesRepository } from './showtimes.repository'
import { ShowtimesService } from './showtimes.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Showtime.name, schema: ShowtimeSchema }])],
    providers: [ShowtimesService, ShowtimesRepository],
    exports: [ShowtimesService]
})
export class ShowtimesModule {}

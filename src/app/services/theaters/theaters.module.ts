import { Module } from '@nestjs/common'
import { Theater, TheaterSchema } from './schemas'
import { TheatersRepository } from './theaters.repository'
import { TheatersService } from './theaters.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Theater.name, schema: TheaterSchema }])],
    providers: [TheatersService, TheatersRepository],
    exports: [TheatersService]
})
export class TheatersModule {}

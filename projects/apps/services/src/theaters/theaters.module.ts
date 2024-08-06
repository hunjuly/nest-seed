import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Theater, TheaterSchema } from './schemas'
import { TheatersController } from './theaters.controller'
import { TheatersRepository } from './theaters.repository'
import { TheatersService } from './theaters.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: Theater.name, schema: TheaterSchema }])],
    providers: [TheatersService, TheatersRepository],
    controllers: [TheatersController],
    exports: [TheatersService]
})
export class TheatersModule {}

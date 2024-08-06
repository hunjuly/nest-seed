import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MoviesController } from './movies.controller'
import { MoviesRepository } from './movies.repository'
import { MoviesService } from './movies.service'
import { Movie, MovieSchema } from './schemas'

@Module({
    imports: [MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])],
    providers: [MoviesService, MoviesRepository],
    controllers: [MoviesController],
    exports: [MoviesService]
})
export class MoviesModule {}

import { Module } from '@nestjs/common'
import { Movie, MovieSchema } from './schemas'
import { MoviesRepository } from './movies.repository'
import { MoviesService } from './movies.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])],
    providers: [MoviesService, MoviesRepository],
    exports: [MoviesService]
})
export class MoviesModule {}

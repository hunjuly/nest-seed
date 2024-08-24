import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { StorageFilesModule } from '../storage-files'
import { MoviesController } from './movies.controller'
import { MoviesRepository } from './movies.repository'
import { MoviesService } from './movies.service'
import { Movie, MovieSchema } from './schemas'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        StorageFilesModule
    ],
    providers: [MoviesService, MoviesRepository],
    exports: [MoviesService],
    controllers: [MoviesController]
})
export class MoviesModule {}

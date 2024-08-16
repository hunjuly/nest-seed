import { Module } from '@nestjs/common'
import { Movie, MovieSchema } from './schemas'
import { MoviesRepository } from './movies.repository'
import { MoviesService } from './movies.service'
import { MongooseModule } from '@nestjs/mongoose'
import { StorageFilesModule } from '../storage-files'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        StorageFilesModule
    ],
    providers: [MoviesService, MoviesRepository],
    exports: [MoviesService]
})
export class MoviesModule {}

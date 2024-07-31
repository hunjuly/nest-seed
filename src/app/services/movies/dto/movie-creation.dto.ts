import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { MovieGenre, MovieRating } from '../schemas'

export class MovieCreationDto {
    @IsString()
    @IsNotEmpty()
    title: string

    @IsArray()
    @IsEnum(MovieGenre, { each: true })
    genre: MovieGenre[]

    @IsDate()
    @Type(() => Date)
    releaseDate: Date

    @IsString()
    @MaxLength(5000)
    plot: string

    @IsInt()
    durationMinutes: number

    @IsString()
    director: string

    @IsEnum(MovieRating)
    rating: MovieRating
}

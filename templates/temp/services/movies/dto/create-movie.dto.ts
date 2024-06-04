import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { MovieEnum } from '../schemas'

export class CreateMovieDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @MaxLength(255)
    desc: string

    @IsDate()
    @Type(() => Date)
    date: Date

    @IsArray()
    @IsEnum(MovieEnum, { each: true })
    enums: MovieEnum[]

    @IsInt()
    integer: number
}

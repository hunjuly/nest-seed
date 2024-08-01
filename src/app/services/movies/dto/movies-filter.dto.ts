import { IsOptional } from 'class-validator'

export class MoviesQueryDto {
    @IsOptional()
    title?: string

    @IsOptional()
    genre?: string

    @IsOptional()
    releaseDate?: Date

    @IsOptional()
    plot?: string

    @IsOptional()
    durationMinutes?: number

    @IsOptional()
    director?: string

    @IsOptional()
    rating?: string
}

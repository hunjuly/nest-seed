import { IsOptional } from 'class-validator'

export class MoviesFilterDto {
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
    rated?: string
}

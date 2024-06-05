import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class MoviesQueryDto extends PaginationOptions {
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

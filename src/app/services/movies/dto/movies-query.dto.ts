import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class MoviesQueryDto extends PaginationOption {
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

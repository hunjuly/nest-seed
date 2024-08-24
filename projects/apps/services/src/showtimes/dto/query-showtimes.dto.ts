import { IsOptional } from 'class-validator'

export class QueryShowtimesDto {
    @IsOptional()
    movieId?: string

    @IsOptional()
    theaterId?: string

    @IsOptional()
    batchId?: string

    @IsOptional()
    showtimeIds?: string[]
}

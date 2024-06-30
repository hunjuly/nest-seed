import { IsOptional } from 'class-validator'

export class TicketsFilterDto {
    @IsOptional()
    movieId?: string

    @IsOptional()
    theaterId?: string

    @IsOptional()
    theaterIds?: string[]
}

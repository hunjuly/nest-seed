import { IsOptional } from 'class-validator'

export class TicketsQueryDto {
    @IsOptional()
    movieId?: string

    @IsOptional()
    theaterId?: string

    @IsOptional()
    theaterIds?: string[]

    @IsOptional()
    ticketIds?: string[]

    @IsOptional()
    batchId?: string

    @IsOptional()
    showtimeId?: string
}

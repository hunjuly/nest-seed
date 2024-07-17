import { IsOptional } from 'class-validator'

export class TicketsFilterDto {
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

export class TicketSalesStatus {
    showtimeId: string
    total: number
    sold: number
    available: number
}

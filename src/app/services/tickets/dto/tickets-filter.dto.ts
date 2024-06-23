import { IsOptional } from 'class-validator'

export class TicketsFilterDto {
    @IsOptional()
    theaterId?: string

    @IsOptional()
    movieId?: string
}

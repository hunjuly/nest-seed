import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class TicketsQueryDto extends PaginationOption {
    @IsOptional()
    theaterId?: string

    @IsOptional()
    movieId?: string
}

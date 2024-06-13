import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class TicketsQueryDto extends PaginationOptions {
    @IsOptional()
    theaterId?: string

    @IsOptional()
    movieId?: string
}

import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class ShowtimesQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string

    @IsOptional()
    email?: string
}

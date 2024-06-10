import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class TheatersQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

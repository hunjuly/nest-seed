import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class MongolsQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'src/common'

export class SeedsQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

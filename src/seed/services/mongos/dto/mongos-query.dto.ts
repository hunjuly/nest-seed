import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class MongosQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

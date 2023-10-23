import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'src/common'

export class MongosQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

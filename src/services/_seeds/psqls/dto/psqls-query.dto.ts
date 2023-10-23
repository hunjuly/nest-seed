import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'src/common'

export class PsqlsQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

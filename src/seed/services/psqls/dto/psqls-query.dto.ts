import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class PsqlsQueryDto extends PaginationOptions {
    @IsOptional()
    name?: string
}

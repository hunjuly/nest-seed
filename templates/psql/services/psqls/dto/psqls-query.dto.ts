import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class PsqlsQueryDto extends PaginationOption {
    @IsOptional()
    name?: string

    @IsOptional()
    email?: string
}

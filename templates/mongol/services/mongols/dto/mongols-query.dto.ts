import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class MongolsQueryDto extends PaginationOption {
    @IsOptional()
    name?: string

    @IsOptional()
    email?: string
}

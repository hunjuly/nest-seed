import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class CustomersQueryDto extends PaginationOption {
    @IsOptional()
    name?: string

    @IsOptional()
    email?: string
}

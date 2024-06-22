import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class UsersQueryDto extends PaginationOption {
    @IsOptional()
    email?: string
}

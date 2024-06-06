import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'common'

export class UsersQueryDto extends PaginationOptions {
    @IsOptional()
    email?: string
}

import { IsOptional } from 'class-validator'
import { PaginationOptions } from 'src/common'

export class UsersQueryDto extends PaginationOptions {
    @IsOptional()
    email?: string
}

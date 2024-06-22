import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class TheatersQueryDto extends PaginationOption {
    @IsOptional()
    name?: string
}

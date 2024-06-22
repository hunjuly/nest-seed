import { IsOptional } from 'class-validator'
import { PaginationOption } from 'common'

export class ShowtimesQueryDto extends PaginationOption {
    @IsOptional()
    theaterId?: string

    @IsOptional()
    batchId?: string
}

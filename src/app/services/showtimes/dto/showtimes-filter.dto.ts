import { IsOptional } from 'class-validator'

export class ShowtimesFilterDto {
    @IsOptional()
    theaterId?: string

    @IsOptional()
    batchId?: string
}

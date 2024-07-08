import { IsOptional } from 'class-validator'

export class TheatersFilterDto {
    @IsOptional()
    name?: string
}

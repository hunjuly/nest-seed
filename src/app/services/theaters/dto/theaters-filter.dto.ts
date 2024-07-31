import { IsOptional } from 'class-validator'

export class TheatersQueryDto {
    @IsOptional()
    name?: string
}

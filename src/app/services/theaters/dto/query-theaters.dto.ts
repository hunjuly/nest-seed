import { IsOptional } from 'class-validator'

export class QueryTheatersDto {
    @IsOptional()
    name?: string
}

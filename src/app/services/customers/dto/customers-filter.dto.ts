import { IsOptional } from 'class-validator'

export class CustomersFilterDto {
    @IsOptional()
    name?: string

    @IsOptional()
    email?: string
}

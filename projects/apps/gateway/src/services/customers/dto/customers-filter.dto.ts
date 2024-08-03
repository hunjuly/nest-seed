import { IsOptional } from 'class-validator'

export class CustomersQueryDto {
    @IsOptional()
    name?: string

    @IsOptional()
    email?: string
}

import { IsOptional } from 'class-validator'

export class QueryPaymentsDto {
    @IsOptional()
    paymentId?: string

    @IsOptional()
    customerId?: string
}

import { IsOptional } from 'class-validator'

export class PaymentsFilterDto {
    @IsOptional()
    paymentId?: string

    @IsOptional()
    customerId?: string
}

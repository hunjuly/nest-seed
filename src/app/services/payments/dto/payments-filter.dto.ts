import { IsOptional } from 'class-validator'

export class PaymentsQueryDto {
    @IsOptional()
    paymentId?: string

    @IsOptional()
    customerId?: string
}

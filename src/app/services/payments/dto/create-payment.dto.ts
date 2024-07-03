import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator'

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    customerId: string

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    ticketIds: string[]
}

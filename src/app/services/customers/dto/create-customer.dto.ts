import { Type } from 'class-transformer'
import { IsDate, IsNotEmpty, IsString } from 'class-validator'

export class CreateCustomerDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsDate()
    @Type(() => Date)
    date: Date
}

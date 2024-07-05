import { Type } from 'class-transformer'
import { IsDate, IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class CustomerCreationDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsDate()
    @Type(() => Date)
    birthday: Date
}

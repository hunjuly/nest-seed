import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { TicketEnum } from '../schemas'

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @MaxLength(255)
    desc: string

    @IsDate()
    @Type(() => Date)
    date: Date

    @IsArray()
    @IsEnum(TicketEnum, { each: true })
    enums: TicketEnum[]

    @IsInt()
    integer: number
}

import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { ShowtimeEnum } from '../schemas'

export class CreateShowtimeDto {
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
    @IsEnum(ShowtimeEnum, { each: true })
    enums: ShowtimeEnum[]

    @IsInt()
    integer: number
}

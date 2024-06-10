import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { PsqlEnum } from '../entities'

export class CreatePsqlDto {
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
    @IsEnum(PsqlEnum, { each: true })
    enums: PsqlEnum[]

    @IsInt()
    integer: number
}

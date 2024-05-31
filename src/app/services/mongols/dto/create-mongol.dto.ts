import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { MongolEnum } from '../schemas'

export class CreateMongolDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @MaxLength(255)
    desc: string

    @IsDate()
    @Type(() => Date)
    date: Date

    @IsArray()
    @IsEnum(MongolEnum, { each: true })
    enums: MongolEnum[]

    @IsInt()
    integer: number
}

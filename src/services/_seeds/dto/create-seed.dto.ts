import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { SeedEnum } from '../entities'

export class CreateSeedDto {
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
    @IsEnum(SeedEnum, { each: true })
    enums: SeedEnum[]

    @IsInt()
    integer: number
}

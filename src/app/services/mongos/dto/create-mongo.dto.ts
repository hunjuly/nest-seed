import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { MongoEnum } from '../schemas'

export class CreateMongoDto {
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
    @IsEnum(MongoEnum, { each: true })
    enums: MongoEnum[]

    @IsInt()
    integer: number
}

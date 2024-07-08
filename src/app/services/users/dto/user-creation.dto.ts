import { Type } from 'class-transformer'
import { IsDate, IsEmail, IsString } from 'class-validator'

export class UserCreationDto {
    @IsEmail()
    email: string

    @IsString()
    username: string

    @IsString()
    firstName: string

    @IsString()
    lastName: string

    @IsDate()
    @Type(() => Date)
    birthdate: Date

    @IsString()
    password: string
}

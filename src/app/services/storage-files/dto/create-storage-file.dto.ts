import { IsInt, IsNotEmpty, IsString } from 'class-validator'

export class CreateStorageFileDto {
    @IsString()
    @IsNotEmpty()
    originalname: string

    @IsString()
    @IsNotEmpty()
    filename: string

    @IsString()
    @IsNotEmpty()
    mimetype: string

    @IsInt()
    size: number

    @IsString()
    @IsNotEmpty()
    path: string
}

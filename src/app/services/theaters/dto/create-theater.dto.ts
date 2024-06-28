import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator'
import { Seatmap } from '../schemas'

export class LatLongDto {
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number
}

export class CreateTheaterDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @ValidateNested()
    @Type(() => LatLongDto)
    latlong: LatLongDto

    @IsNotEmpty()
    seatmap: Seatmap
}

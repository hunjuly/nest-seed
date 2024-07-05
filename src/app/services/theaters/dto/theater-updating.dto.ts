import { PartialType } from '@nestjs/mapped-types'
import { TheaterCreationDto } from './create-theater.dto'

export class TheaterUpdatingDto extends PartialType(TheaterCreationDto) {}

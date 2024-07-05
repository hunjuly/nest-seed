import { PartialType } from '@nestjs/mapped-types'
import { MovieCreationDto } from './create-movie.dto'

export class MovieUpdatingDto extends PartialType(MovieCreationDto) {}

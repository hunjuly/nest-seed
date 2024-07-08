import { PartialType } from '@nestjs/mapped-types'
import { MovieCreationDto } from './movie-creation.dto'

export class MovieUpdatingDto extends PartialType(MovieCreationDto) {}

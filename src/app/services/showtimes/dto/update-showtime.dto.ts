import { PartialType } from '@nestjs/mapped-types'
import { CreateShowtimeDto } from './create-showtime.dto'

export class UpdateShowtimeDto extends PartialType(CreateShowtimeDto) {}

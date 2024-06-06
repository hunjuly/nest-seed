import { PartialType } from '@nestjs/mapped-types'
import { CreateMongolDto } from './create-mongol.dto'

export class UpdateMongolDto extends PartialType(CreateMongolDto) {}

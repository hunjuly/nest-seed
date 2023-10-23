import { PartialType } from '@nestjs/mapped-types'
import { CreatePsqlDto } from './create-psql.dto'

export class UpdatePsqlDto extends PartialType(CreatePsqlDto) {}

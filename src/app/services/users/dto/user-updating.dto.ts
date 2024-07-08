import { PartialType } from '@nestjs/mapped-types'
import { UserCreationDto } from './user-creation.dto'

export class UserUpdatingDto extends PartialType(UserCreationDto) {}

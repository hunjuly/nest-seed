import { PartialType } from '@nestjs/mapped-types'
import { UserCreationDto } from './create-user.dto'

export class UserUpdatingDto extends PartialType(UserCreationDto) {}

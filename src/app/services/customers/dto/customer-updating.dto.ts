import { PartialType } from '@nestjs/mapped-types'
import { CustomerCreationDto } from './customer-creation.dto'

export class CustomerUpdatingDto extends PartialType(CustomerCreationDto) {}

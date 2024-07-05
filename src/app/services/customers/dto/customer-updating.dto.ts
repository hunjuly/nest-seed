import { PartialType } from '@nestjs/mapped-types'
import { CustomerCreationDto } from './create-customer.dto'

export class CustomerUpdatingDto extends PartialType(CustomerCreationDto) {}

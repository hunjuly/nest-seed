import { IsOptional } from 'class-validator'

export class UsersFilterDto {
    @IsOptional()
    email?: string
}

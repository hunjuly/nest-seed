import { BadRequestException } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export enum OrderDirection {
    asc = 'asc',
    desc = 'desc'
}

export class OrderOption {
    @IsString()
    name: string

    @IsString()
    direction: OrderDirection
}

export class PaginationOptions {
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    skip?: number

    @IsOptional()
    @Transform(({ value }) => {
        const parts = value.split(':')

        if (parts.length !== 2) {
            throw new BadRequestException('Invalid orderby format. It should be name:direction')
        }

        const [name, direction] = parts

        if (!(direction in OrderDirection)) {
            throw new BadRequestException('Invalid direction. It should be either "asc" or "desc".')
        }

        return { name, direction }
    })
    orderby?: OrderOption
}

export class PaginationResult<E> {
    @IsInt()
    skip: number | undefined

    @IsInt()
    take: number | undefined

    @IsInt()
    total: number

    items: E[]
}

import { BadRequestException } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

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

export const DEFAULT_TAKE_SIZE = 20
export const MAX_TAKE_SIZE = 100

export class PaginationOptions {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(MAX_TAKE_SIZE)
    take?: number = DEFAULT_TAKE_SIZE

    @IsOptional()
    @IsInt()
    @Min(0)
    skip?: number = 0

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

export const defaultPaginationResult: PaginationResult<any> = {
    skip: undefined,
    take: undefined,
    total: 0,
    items: []
}

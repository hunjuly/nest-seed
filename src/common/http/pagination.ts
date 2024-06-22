import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
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

export class PaginationOption {
    @IsOptional()
    @IsInt()
    @Min(0)
    take: number = 0

    @IsOptional()
    @IsInt()
    @Min(0)
    skip: number = 0

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

@Injectable()
export class PaginationPipe implements PipeTransform {
    constructor(private takeLimit: number) {}

    transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.type === 'query') {
            if (0 < value.take) {
                if (this.takeLimit < value.take) {
                    throw new BadRequestException(
                        `The 'take' parameter exceeds the maximum allowed limit of ${this.takeLimit}.`
                    )
                }
            } else if (0 === value.take) {
                value.take = this.takeLimit
            }
        }

        return value
    }
}

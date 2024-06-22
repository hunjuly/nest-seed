import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
// TODO
// BadRequestException는 HttpException이다.
// 일단 http에 포함시키지만 grpc 작업 시 이동 가능성 있다.

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

@Injectable()
export class PaginationPipe implements PipeTransform {
    constructor(private defaultMaxSize: number) {}

    transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.type === 'query') {
            if (value.take) {
                if (this.defaultMaxSize < value.take)
                    throw new BadRequestException(
                        `The 'take' parameter exceeds the maximum allowed limit of ${this.defaultMaxSize}.`
                    )
            } else {
                value.take = this.defaultMaxSize
            }
        }

        return value
    }
}

// @Get()
// @UsePipes(new PaginationPipe(50))
// async findAll(@Query() query2: TitleOptions) {
//     return query2
// }

import { UsePipes, Controller, Get, Module, Query } from '@nestjs/common'
import { IsNotEmpty } from 'class-validator'
import { PaginationOptions, PaginationPipe } from '../pagination'

export class UserDto {
    @IsNotEmpty()
    name: string
}

@Controller('samples')
class SamplesController {
    @Get()
    async handleQuery(@Query() query: PaginationOptions) {
        return query
    }

    @Get('multiple')
    @UsePipes(new PaginationPipe(50))
    async handleMultiple(@Query() pagination: PaginationOptions, @Query() user: UserDto) {
        return { pagination, user }
    }

    @Get('maxsize')
    @UsePipes(new PaginationPipe(50))
    async handleMaxsize(@Query() pagination: PaginationOptions) {
        return pagination
    }
}

@Module({
    controllers: [SamplesController]
})
export class SamplesModule {}

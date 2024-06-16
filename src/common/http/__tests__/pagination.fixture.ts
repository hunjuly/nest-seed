import { Controller, Get, Module, Query } from '@nestjs/common'
import { PaginationOptions } from 'common'

@Controller('samples')
class SamplesController {
    @Get()
    async findAll(@Query() query: PaginationOptions) {
        return query
    }
}

@Module({
    controllers: [SamplesController]
})
export class SamplesModule {}

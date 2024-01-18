import { Controller, Get, Module, Query } from '@nestjs/common'
import { PaginationOptions, TypeormEntity } from 'common'
import { Column, Entity } from 'typeorm'

@Entity()
export class Sample extends TypeormEntity {
    @Column()
    name: string
}

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

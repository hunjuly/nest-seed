import { Body, Controller, Get, Injectable, Module, Post, Query } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { IsOptional, IsString } from 'class-validator'
import { PaginationOptions, PaginationResult, Typeorm } from 'common'
import { Column, Entity, Repository } from 'typeorm'

@Entity()
export class Sample extends Typeorm.AggregateRoot {
    @Column()
    name: string
}

class CreateDto {
    @IsString()
    name: string
}

class SamplesQueryDto extends PaginationOptions {
    @IsOptional()
    title?: string
}

@Injectable()
class SampleRepository extends Typeorm.Repository<Sample> {
    constructor(@InjectRepository(Sample) typeorm: Repository<Sample>) {
        super(typeorm)
    }

    async findAll(pageOptions: PaginationOptions): Promise<PaginationResult<Sample>> {
        const { take, skip } = pageOptions

        const qb = this.createQueryBuilder(pageOptions)

        const [items, total] = await qb.getManyAndCount()

        return { items, total, take, skip }
    }
}

@Controller('samples')
class SamplesController {
    constructor(private repository: SampleRepository) {}

    @Post()
    async create(@Body() createSeedDto: CreateDto) {
        return this.repository.create(createSeedDto)
    }

    @Get()
    async findAll(@Query() query: SamplesQueryDto) {
        return this.repository.findAll(query)
    }
}

@Module({
    imports: [Typeorm.createMemoryModule(), TypeOrmModule.forFeature([Sample])],
    controllers: [SamplesController],
    providers: [SampleRepository]
})
export class SamplesModule {}

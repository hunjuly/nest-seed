import { Body, Controller, Get, Injectable, Module, Post, Query } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { IsOptional, IsString } from 'class-validator'
import { Column, Entity, Repository } from 'typeorm'
import { AggregateRoot, BaseRepository, TransactionService, createMemoryTypeormModule } from '../../typeorm'
import { PaginationOptions, PaginationResult } from '../pagination'

@Entity()
class Sample extends AggregateRoot {
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
class SampleRepository extends BaseRepository<Sample> {
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
    imports: [createMemoryTypeormModule(), TypeOrmModule.forFeature([Sample])],
    controllers: [SamplesController],
    providers: [SampleRepository, TransactionService]
})
export class SamplesModule {}

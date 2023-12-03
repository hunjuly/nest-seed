import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import {
    PaginationOptions,
    PaginationResult,
    TypeormAggregateRoot,
    TypeormRepository,
    TransactionService,
    createMemoryTypeormModule
} from 'common'
import { Column, Entity, Repository } from 'typeorm'

/**
 * @Entity()와 같은 데코레이터를 *.spec.ts에 정의하면,
 * code lens가 동작하지 않아서 .spec.ts에서 Run|Debug가 안 보인다.
 */
@Entity()
export class Sample extends TypeormAggregateRoot {
    @Column()
    name: string
}

@Injectable()
export class SampleRepository extends TypeormRepository<Sample> {
    constructor(@InjectRepository(Sample) typeorm: Repository<Sample>) {
        super(typeorm)
    }

    async findAll(): Promise<Sample[]> {
        const qb = this.createQueryBuilder()

        const [items] = await qb.getManyAndCount()

        return items
    }

    async orderby(pageOptions: PaginationOptions): Promise<PaginationResult<Sample>> {
        const { take, skip } = pageOptions

        const qb = this.createQueryBuilder(pageOptions)

        const [items, total] = await qb.getManyAndCount()

        return { items, total, take, skip }
    }
}

@Module({
    imports: [createMemoryTypeormModule(), TypeOrmModule.forFeature([Sample])],
    providers: [SampleRepository, TransactionService]
})
export class SamplesModule {}

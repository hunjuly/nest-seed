import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { TransactionService } from '../transaction.service'
import { Column, Entity, Repository } from 'typeorm'
import { AggregateRoot } from '../aggregate-root'
import { BaseRepository } from '../base.repository'
import { PaginationOptions, PaginationResult } from '../../../pagination'
import { createMemoryTypeormModule } from '../../'

/**
 * 아래 코드를 base.repository.spec.ts에 정의하면 code lens가 동작하지 않는다.
 * 그러면 .spec.ts에서 Run|Debug가 안 뜬다.
 */

@Entity()
export class Sample extends AggregateRoot {
    @Column()
    name: string
}

@Injectable()
export class SampleRepository extends BaseRepository<Sample> {
    constructor(@InjectRepository(Sample) typeorm: Repository<Sample>) {
        super(typeorm)
    }

    async default(): Promise<Sample[]> {
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

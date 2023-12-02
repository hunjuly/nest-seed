import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { Column, Entity, Repository } from 'typeorm'
import { createMemoryTypeormModule } from '../../'
import { AggregateRoot } from '../aggregate-root'
import { BaseRepository } from '../base.repository'
import { TransactionService } from '../transaction.service'

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
}

@Module({
    imports: [createMemoryTypeormModule(), TypeOrmModule.forFeature([Sample])],
    providers: [SampleRepository, TransactionService]
})
export class SamplesModule {}

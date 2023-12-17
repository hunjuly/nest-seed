import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { AggregateRoot, BaseRepository, TransactionService, createTypeormMemoryModule } from 'common'
import { Column, Entity, Repository } from 'typeorm'

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
    imports: [createTypeormMemoryModule(), TypeOrmModule.forFeature([Sample])],
    providers: [SampleRepository, TransactionService]
})
export class SamplesModule {}

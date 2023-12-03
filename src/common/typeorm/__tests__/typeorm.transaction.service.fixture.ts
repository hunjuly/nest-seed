import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import {
    TypeormAggregateRoot,
    TypeormRepository,
    TransactionService,
    createMemoryTypeormModule
} from 'common'
import { Column, Entity, Repository } from 'typeorm'

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
}

@Module({
    imports: [createMemoryTypeormModule(), TypeOrmModule.forFeature([Sample])],
    providers: [SampleRepository, TransactionService]
})
export class SamplesModule {}

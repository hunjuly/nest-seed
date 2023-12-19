import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { TypeormEntity, TypeormRepository, TypeormTransactionService, createTypeormMemoryModule } from 'common'
import { Column, Entity, Repository } from 'typeorm'

@Entity()
export class Sample extends TypeormEntity {
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
    imports: [createTypeormMemoryModule(), TypeOrmModule.forFeature([Sample])],
    providers: [SampleRepository, TypeormTransactionService]
})
export class SamplesModule {}

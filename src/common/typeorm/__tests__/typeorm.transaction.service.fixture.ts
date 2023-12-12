import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { Typeorm } from 'common'
import { Column, Entity, Repository } from 'typeorm'

@Entity()
export class Sample extends Typeorm.AggregateRoot {
    @Column()
    name: string
}

@Injectable()
export class SampleRepository extends Typeorm.Repository<Sample> {
    constructor(@InjectRepository(Sample) typeorm: Repository<Sample>) {
        super(typeorm)
    }
}

@Module({
    imports: [Typeorm.createMemoryModule(), TypeOrmModule.forFeature([Sample])],
    providers: [SampleRepository, Typeorm.TransactionService]
})
export class SamplesModule {}

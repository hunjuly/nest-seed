import { Injectable, Module } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { TypeormEntity, TypeormRepository } from 'common'
import { isEqual } from 'lodash'
import { Column, Entity, Repository } from 'typeorm'

@Entity()
export class Sample extends TypeormEntity {
    @Column()
    name: string
}

@Injectable()
export class SamplesRepository extends TypeormRepository<Sample> {
    constructor(@InjectRepository(Sample) repo: Repository<Sample>) {
        super(repo)
    }
}

@Module({
    imports: [TypeOrmModule.forFeature([Sample])],
    providers: [SamplesRepository]
})
export class SamplesModule {}

export function sortSamples(samples: Sample[]) {
    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}

export async function isCreatedEntityCorrect(entity: Sample, createData: any): Promise<boolean> {
    const entityBase = {
        id: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        version: expect.anything()
    }

    return isEqual(entity, {
        ...entityBase,
        ...createData
    })
}

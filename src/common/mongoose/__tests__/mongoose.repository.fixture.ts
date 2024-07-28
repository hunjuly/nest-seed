import { expect } from '@jest/globals'
import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { MongooseRepository, MongooseSchema, createMongooseSchema, padNumber } from 'common'
import { createTestingModule } from 'common/test'
import { Connection, Model } from 'mongoose'

@Schema()
export class Sample extends MongooseSchema {
    @Prop({ required: true })
    name: string
}

export const DocumentSchema = createMongooseSchema(Sample)

@Injectable()
export class SamplesRepository extends MongooseRepository<Sample> {
    constructor(@InjectModel(Sample.name) model: Model<Sample>) {
        super(model)
    }

    // async update(id: DocumentId, updateDto: Partial<Sample>): Promise<Sample> {
    //     return await this.executeUpdate(id, (doc: Sample) => {
    //         if (updateDto.name) doc.name = updateDto.name
    //     })
    // }
}

@Module({
    imports: [MongooseModule.forFeature([{ name: Sample.name, schema: DocumentSchema }])],
    providers: [SamplesRepository]
})
export class SampleModule {}

export function sortByName(documents: Sample[]) {
    return documents.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(documents: Sample[]) {
    return documents.sort((a, b) => b.name.localeCompare(a.name))
}

export async function createSample(repository: SamplesRepository): Promise<Sample> {
    return repository.create({ name: `Sample-Name` })
}

export async function createSamples(repository: SamplesRepository): Promise<Sample[]> {
    return Promise.all(
        Array.from({ length: 20 }, (_, index) =>
            repository.create({ name: `Sample-${padNumber(index, 3)}` })
        )
    )
}

export const generated = {
    _id: expect.anything(),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
}

export async function createFixture(mongoUri: string) {
    const module = await createTestingModule({
        imports: [
            MongooseModule.forRoot(mongoUri, {
                connectionFactory: async (connection: Connection) => {
                    await connection.dropDatabase()
                    return connection
                }
            }),
            SampleModule
        ]
    })

    const repository = module.get(SamplesRepository)

    return {
        repository,
        module,
        teardown: async () => {
            await module.close()
        }
    }
}

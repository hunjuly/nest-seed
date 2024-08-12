import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { createMongooseSchema, MongooseSchema, MongooseRepository, padNumber } from 'common'
import { createTestingModule } from 'common/test'
import { Connection, HydratedDocument, Model } from 'mongoose'

@Schema()
export class SampleSchema extends MongooseSchema {
    @Prop({ required: true })
    name: string
}

export type Sample = HydratedDocument<SampleSchema>

export class SampleDto {
    id: string
    name: string

    constructor(sample: Sample) {
        const { id, name } = sample

        Object.assign(this, { id: id.toString(), name })
    }
}

@Injectable()
export class SamplesRepository extends MongooseRepository<SampleSchema> {
    constructor(@InjectModel(SampleSchema.name) model: Model<SampleSchema>) {
        super(model)
    }
}

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SampleSchema.name, schema: createMongooseSchema(SampleSchema) }
        ])
    ],
    providers: [SamplesRepository]
})
export class SampleModule {}

export const sortByName = (documents: SampleDto[]) =>
    documents.sort((a, b) => a.name.localeCompare(b.name))

export const sortByNameDescending = (documents: SampleDto[]) =>
    documents.sort((a, b) => b.name.localeCompare(a.name))

export const createSample = (repository: SamplesRepository) => {
    const doc = repository.newDocument()
    doc.name = 'Sample-Name'
    return doc.save()
}

export const createSamples = async (repository: SamplesRepository) =>
    Promise.all(
        Array.from({ length: 20 }, async (_, index) => {
            const doc = repository.newDocument()
            doc.name = `Sample-${padNumber(index, 3)}`
            return doc.save()
        })
    )

export async function createFixture(uri: string) {
    const module = await createTestingModule({
        imports: [
            MongooseModule.forRoot(uri, {
                /*
                If we don't set autoCreate: false, the following error occurs when calling await session.commitTransaction():

                "MongoServerError: Caused by :: Collection namespace 'test.samples' is already in use."

                The actual effect of autoCreate: false:
                This setting disables automatic collection creation at the Mongoose level.
                However, automatic collection creation at the MongoDB server level is still enabled.
                */
                autoCreate: false,
                connectionFactory: async (connection: Connection) => {
                    await connection.dropDatabase()
                    return connection
                }
            }),
            SampleModule
        ]
    })
    const repository = module.get(SamplesRepository)
    const teardown = async () => {
        await module.close()
    }

    return { module, repository, teardown }
}

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
                // autoCreate: false 하지 않으면 await session.commitTransaction() 할 때 아래 오류가 발생한다.
                // MongoServerError: Caused by :: Collection namespace 'test.samples' is already in use. :: Please retry your operation or multi-document transaction.
                // autoCreate: false의 실제 영향:
                // 이 설정은 Mongoose 레벨에서의 자동 컬렉션 생성을 비활성화합니다.
                // 그러나 MongoDB 서버 레벨에서의 자동 컬렉션 생성은 여전히 활성화되어 있습니다.
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

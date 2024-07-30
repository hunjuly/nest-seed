import { expect } from '@jest/globals'
import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { createMongooseSchema, MongooseRepository, MongooseSchema, padNumber } from 'common'
import { createTestingModule } from 'common/test'
import { Connection, Model } from 'mongoose'
import { Repository } from 'typeorm'

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
}

@Module({
    imports: [MongooseModule.forFeature([{ name: Sample.name, schema: DocumentSchema }])],
    providers: [SamplesRepository]
})
export class SampleModule {}

export const sortByName = (documents: Sample[]) =>
    documents.sort((a, b) => a.name.localeCompare(b.name))

export const sortByNameDescending = (documents: Sample[]) =>
    documents.sort((a, b) => b.name.localeCompare(a.name))

export const createSample = (repository: SamplesRepository): Promise<Sample> =>
    repository.create((doc) => {
        doc.name = 'Sample-Name'
    })

export const createSamples = async (repository: SamplesRepository) =>
    Promise.all(
        Array.from({ length: 20 }, (_, index) =>
            repository.create((doc) => {
                doc.name = `Sample-${padNumber(index, 3)}`
            })
        )
    )

export const generated = {
    _id: expect.anything(),
    _c: expect.anything(),
    _u: expect.anything(),
    _v: expect.anything()
}

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

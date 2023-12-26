import { isEqual } from 'lodash'
import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { MongooseRepository, MongooseSchema, PaginationResult, createMongooseSchema } from 'common'
import { HydratedDocument, Model } from 'mongoose'

@Schema()
export class Sample extends MongooseSchema {
    @Prop()
    name: string
}

export const SampleSchema = createMongooseSchema(Sample)
export type SampleDocument = HydratedDocument<Sample>

@Injectable()
export class SamplesRepository extends MongooseRepository<Sample> {
    constructor(@InjectModel(Sample.name) model: Model<Sample>) {
        super(model)
    }

    async update(id: string, updateMongoDto: Partial<Sample>): Promise<SampleDocument> {
        /**
         * 사용자의 입력값을 그대로 사용하지 않고 안전한 값으로 변환하여 사용.
         * 이렇게 하지 않으면 github에서 아래의 취약점에 대한 경고가 발생.
         * Database query built from user-controlled sources
         */
        const updateData: Partial<Sample> = {}
        updateData.name = updateMongoDto.name

        return super.update(id, updateData)
    }
}

@Module({
    imports: [MongooseModule.forFeature([{ name: Sample.name, schema: SampleSchema }])],
    providers: [SamplesRepository]
})
export class SamplesModule {}

export function sortSamples(samples: SampleDocument[]) {
    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}

export async function isCreatedDocumentCorrect(document: SampleDocument, createData: any): Promise<boolean> {
    const entityBase = {
        _id: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        version: expect.anything()
    }

    return isEqual(document.toJSON(), {
        ...entityBase,
        ...createData
    })
}

export function areDocumentsEqual(a: SampleDocument[], b: SampleDocument[]) {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i].toJSON(), b[i].toJSON())) {
            console.log('a[i].toJSON()', a[i].toJSON(), 'b[i].toJSON()', b[i].toJSON())
            return false
        }
    }

    return true
}

export function arePaginatedResultsEqual(
    a: PaginationResult<SampleDocument>,
    b: PaginationResult<SampleDocument>
) {
    if (a.total !== b.total) {
        console.log('a.total', a.total, 'b.total', b.total)
        return false
    }

    if (a.take !== b.take) {
        console.log('a.take', a.take, 'b.take', b.take)
        return false
    }

    if (a.skip !== b.skip) {
        console.log('a.skip', a.skip, 'b.skip', b.skip)
        return false
    }

    if (!areDocumentsEqual(a.items, b.items)) {
        console.log('a.items', a.items, 'b.items', b.items)
        return false
    }

    return true
}

export const createData = {
    name: 'sample name'
}

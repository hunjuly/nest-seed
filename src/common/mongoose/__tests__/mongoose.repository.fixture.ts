import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import {
    DocumentId,
    Exception,
    MongooseRepository,
    MongooseSchema,
    createMongooseSchema,
    padNumber
} from 'common'
import { Model } from 'mongoose'

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

    async update(id: DocumentId, updateDto: Partial<Sample>): Promise<Sample> {
        const document = await this.model.findById(id).exec()

        if (!document) {
            throw new Exception(`Failed to update document with id: ${id}. Document not found.`)
        }

        if (updateDto.name) document.name = updateDto.name

        await document.save()

        return document.toObject()
    }
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

export async function createDocuments(repository: SamplesRepository, count: number): Promise<Sample[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const promise = repository.create({
            name: `Document-${padNumber(i, 3)}`
        })

        promises.push(promise)
    }

    const documents = await Promise.all(promises)

    return documents
}

export const baseFields = {
    _id: expect.anything(),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
}

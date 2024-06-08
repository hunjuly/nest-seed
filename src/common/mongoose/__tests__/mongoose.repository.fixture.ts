import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { Exception, MongooseRepository, MongooseSchema, createMongooseSchema, padNumber } from 'common'
import { Model } from 'mongoose'

@Schema()
export class Document extends MongooseSchema {
    @Prop({ required: true })
    name: string
}

export const DocumentSchema = createMongooseSchema(Document)

@Injectable()
export class DocumentsRepository extends MongooseRepository<Document> {
    constructor(@InjectModel(Document.name) model: Model<Document>) {
        super(model)
    }

    async update(id: string, updateDto: Partial<Document>): Promise<Document> {
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
    imports: [MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }])],
    providers: [DocumentsRepository]
})
export class DocumentsModule {}

export function sortByName(documents: Document[]) {
    return documents.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(documents: Document[]) {
    return documents.sort((a, b) => b.name.localeCompare(a.name))
}

export async function createDocuments(repository: DocumentsRepository): Promise<Document[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const promise = repository.create({
            name: `Document-${padNumber(i, 3)}`
        })

        promises.push(promise)
    }

    const documents = await Promise.all(promises)

    return documents
}

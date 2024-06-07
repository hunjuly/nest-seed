import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { MongooseRepository, MongooseSchema, createMongooseSchema } from 'common'
import { HydratedDocument, Model } from 'mongoose'

@Schema()
export class Sample extends MongooseSchema {
    @Prop({ required: true })
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
         * Convert the user's input to a safe value instead of using it as is.
         * Failure to do so will result in a warning from github about the following vulnerability.
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

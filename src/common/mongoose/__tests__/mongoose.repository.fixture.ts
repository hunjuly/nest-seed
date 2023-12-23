import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { MongooseRepository, MongooseSchema, createMongooseSchema } from 'common'
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
}

@Module({
    imports: [MongooseModule.forFeature([{ name: Sample.name, schema: SampleSchema }])],
    providers: [SamplesRepository]
})
export class SamplesModule {}

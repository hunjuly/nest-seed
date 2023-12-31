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

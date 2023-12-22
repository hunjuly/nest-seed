import { Injectable, Module } from '@nestjs/common'
import { InjectModel, MongooseModule, Prop, Schema } from '@nestjs/mongoose'
import { MongooseRepository, MongooseSchema, createMongooseSchema } from 'common'
import { Model } from 'mongoose'

@Schema()
export class Sample extends MongooseSchema {
    @Prop()
    name: string
}

export const SampleSchema = createMongooseSchema(Sample)

@Injectable()
export class SamplesRepository extends MongooseRepository<Sample> {
    constructor(@InjectModel(Sample.name) model: Model<Sample>) {
        super(model)
    }

    // async findAll(): Promise<Sample[]> {
    //     const qb = this.createQueryBuilder()

    //     const [items] = await qb.getManyAndCount()

    //     return items
    // }

    // async orderby(pageOptions: PaginationOptions): Promise<PaginationResult<Sample>> {
    //     const { take, skip } = pageOptions

    //     const qb = this.createQueryBuilder(pageOptions)

    //     const [items, total] = await qb.getManyAndCount()

    //     return { items, total, take, skip }
    // }
}

@Module({
    imports: [MongooseModule.forFeature([{ name: Sample.name, schema: SampleSchema }])],
    providers: [SamplesRepository]
})
export class SamplesModule {}

import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult, updateIntersection } from 'common'
import { CreateMongoDto, MongoDto, MongosQueryDto, UpdateMongoDto } from './dto'
import { MongosRepository } from './mongos.repository'
import { Mongo } from './schemas'
import { HydratedDocument } from 'mongoose'

@Injectable()
export class MongosService {
    constructor(private mongosRepository: MongosRepository) {}

    async createMongo(createMongoDto: CreateMongoDto) {
        const savedMongo = await this.mongosRepository.create(createMongoDto)

        return new MongoDto(savedMongo)
    }

    async mongoExists(mongoId: string): Promise<boolean> {
        const exists = await this.mongosRepository.exist(mongoId)

        return exists
    }

    async findMongos(queryDto: MongosQueryDto): Promise<PaginationResult<MongoDto>> {
        const pagedMongos = await this.mongosRepository.find(queryDto)

        const items = pagedMongos.items.map((mongo) => new MongoDto(mongo))

        return { ...pagedMongos, items }
    }

    async getMongo(mongoId: string) {
        const mongo = await this._getMongo(mongoId)

        return new MongoDto(mongo)
    }

    private async _getMongo(mongoId: string) {
        const mongo = await this.mongosRepository.findById(mongoId)

        Assert.defined(mongo, `Mongo(${mongoId}) not found`)

        return mongo as HydratedDocument<Mongo>
    }

    async updateMongo(mongoId: string, updateMongoDto: UpdateMongoDto) {
        const mongo = await this._getMongo(mongoId)

        const updateMongo = updateIntersection(mongo, updateMongoDto)

        const savedMongo = await this.mongosRepository.update(updateMongo)

        Assert.deepEquals(savedMongo, updateMongo, 'update 요청과 결과가 다름')

        return new MongoDto(savedMongo)
    }

    async removeMongo(mongoId: string) {
        const mongo = await this._getMongo(mongoId)

        await this.mongosRepository.remove(mongo)
    }
}

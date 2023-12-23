import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateMongoDto, MongoDto, MongosQueryDto, UpdateMongoDto } from './dto'
import { MongosRepository } from './mongos.repository'
import { Mongo } from './schemas'

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

    async findByIds(mongoIds: string[]) {
        const foundMongos = await this.mongosRepository.findByIds(mongoIds)

        const mongoDtos = foundMongos.map((mongo) => new MongoDto(mongo))

        return mongoDtos
    }

    async findMongos(queryDto: MongosQueryDto): Promise<PaginationResult<MongoDto>> {
        const pagedMongos = await this.mongosRepository.findByName(queryDto)

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
        const savedMongo = await this.mongosRepository.update2(mongoId, updateMongoDto)

        return new MongoDto(savedMongo)
    }

    async removeMongo(mongoId: string) {
        await this.mongosRepository.remove(mongoId)
    }
}

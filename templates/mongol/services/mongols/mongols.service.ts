import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateMongolDto, MongolDto, MongolsQueryDto, UpdateMongolDto } from './dto'
import { MongolsRepository } from './mongols.repository'
import { Mongol } from './schemas'

@Injectable()
export class MongolsService {
    constructor(private mongolsRepository: MongolsRepository) {}

    async createMongol(createMongolDto: CreateMongolDto) {
        const savedMongol = await this.mongolsRepository.create(createMongolDto)

        return new MongolDto(savedMongol)
    }

    async doesMongolExist(mongolId: string): Promise<boolean> {
        const mongolExists = await this.mongolsRepository.doesIdExist(mongolId)

        return mongolExists
    }

    async findByEmail(email: string): Promise<MongolDto | null> {
        const result = await this.mongolsRepository.findByQuery({ email })

        if (1 === result.items.length) {
            return new MongolDto(result.items[0])
        }

        Assert.unique(result.items, `Duplicate email found: '${email}'. Each email must be unique.`)

        return null
    }

    async findByIds(mongolIds: string[]) {
        const foundMongols = await this.mongolsRepository.findByIds(mongolIds)

        const mongolDtos = foundMongols.map((mongol) => new MongolDto(mongol))

        return mongolDtos
    }

    async findMongols(queryDto: MongolsQueryDto): Promise<PaginationResult<MongolDto>> {
        const paginatedMongols = await this.mongolsRepository.findByQuery(queryDto)

        const items = paginatedMongols.items.map((mongol) => new MongolDto(mongol))

        return { ...paginatedMongols, items }
    }

    async getMongol(mongolId: string) {
        const mongol = await this.getMongolDocument(mongolId)

        return new MongolDto(mongol)
    }

    private async getMongolDocument(mongolId: string) {
        const mongol = await this.mongolsRepository.findById(mongolId)

        Assert.defined(mongol, `Mongol(${mongolId}) not found`)

        return mongol as HydratedDocument<Mongol>
    }

    async updateMongol(mongolId: string, updateMongolDto: UpdateMongolDto) {
        const savedMongol = await this.mongolsRepository.update(mongolId, updateMongolDto)

        return new MongolDto(savedMongol)
    }

    async removeMongol(mongolId: string) {
        await this.mongolsRepository.remove(mongolId)
    }
}

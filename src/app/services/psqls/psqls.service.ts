import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { CreatePsqlDto, PsqlDto, PsqlsQueryDto, UpdatePsqlDto } from './dto'
import { Psql } from './entities'
import { PsqlsRepository } from './psqls.repository'

@Injectable()
export class PsqlsService {
    constructor(private psqlsRepository: PsqlsRepository) {}

    async createPsql(createPsqlDto: CreatePsqlDto) {
        const savedPsql = await this.psqlsRepository.create(createPsqlDto)

        return new PsqlDto(savedPsql)
    }

    async psqlExists(psqlId: string): Promise<boolean> {
        const exists = await this.psqlsRepository.exist(psqlId)

        return exists
    }

    async findByIds(psqlIds: string[]) {
        const foundPsqls = await this.psqlsRepository.findByIds(psqlIds)

        const psqlDtos = foundPsqls.map((psql) => new PsqlDto(psql))

        return psqlDtos
    }

    async findPsqls(queryDto: PsqlsQueryDto): Promise<PaginationResult<PsqlDto>> {
        const paginatedPsqls = await this.psqlsRepository.findByQuery(queryDto)

        const items = paginatedPsqls.items.map((psql) => new PsqlDto(psql))

        return { ...paginatedPsqls, items }
    }

    async getPsql(psqlId: string) {
        const psql = await this.getPsqlEntity(psqlId)

        return new PsqlDto(psql)
    }

    async updatePsql(psqlId: string, updatePsqlDto: UpdatePsqlDto) {
        const savedPsql = await this.psqlsRepository.update(psqlId, updatePsqlDto)

        return new PsqlDto(savedPsql)
    }

    async removePsql(psqlId: string) {
        await this.psqlsRepository.remove(psqlId)
    }

    private async getPsqlEntity(psqlId: string) {
        const psql = await this.psqlsRepository.findById(psqlId)

        Assert.defined(psql, `Psql with ID ${psqlId} not found`)

        return psql as Psql
    }
}

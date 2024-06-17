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

    async doesPsqlExist(psqlId: string): Promise<boolean> {
        const psqlExists = await this.psqlsRepository.doesIdExist(psqlId)

        return psqlExists
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

    async findByEmail(email: string): Promise<PsqlDto | null> {
        const result = await this.psqlsRepository.findByQuery({ email })

        if (1 === result.items.length) {
            return new PsqlDto(result.items[0])
        }

        Assert.unique(result.items, `Duplicate email found: '${email}'. Each email must be unique.`)

        return null
    }

    async getPsql(psqlId: string) {
        const psql = await this.getPsqlEntity(psqlId)

        return new PsqlDto(psql)
    }

    async updatePsql(psqlId: string, updatePsqlDto: UpdatePsqlDto) {
        const savedPsql = await this.psqlsRepository.update(psqlId, updatePsqlDto)

        return new PsqlDto(savedPsql)
    }

    async deletePsql(psqlId: string) {
        await this.psqlsRepository.delete(psqlId)
    }

    private async getPsqlEntity(psqlId: string) {
        const psql = await this.psqlsRepository.findById(psqlId)

        Assert.defined(psql, `Psql with ID ${psqlId} not found`)

        return psql as Psql
    }
}

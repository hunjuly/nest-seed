import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult, updateIntersection } from 'common'
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

    async findPsqls(queryDto: PsqlsQueryDto): Promise<PaginationResult<PsqlDto>> {
        const pagedPsqls = await this.psqlsRepository.find(queryDto)

        const items = pagedPsqls.items.map((psql) => new PsqlDto(psql))

        return { ...pagedPsqls, items }
    }

    async getPsql(psqlId: string) {
        const psql = await this._getPsql(psqlId)

        return new PsqlDto(psql)
    }

    private async _getPsql(psqlId: string) {
        const psql = await this.psqlsRepository.findById(psqlId)

        Assert.defined(psql, `Psql(${psqlId}) not found`)

        return psql as Psql
    }

    async updatePsql(psqlId: string, updatePsqlDto: UpdatePsqlDto) {
        const psql = await this._getPsql(psqlId)

        const updatePsql = updateIntersection(psql, updatePsqlDto)

        const savedPsql = await this.psqlsRepository.update(updatePsql)

        Assert.deepEquals(savedPsql, updatePsql, 'update 요청과 결과가 다름')

        return new PsqlDto(savedPsql)
    }

    async removePsql(psqlId: string) {
        const psql = await this._getPsql(psqlId)

        await this.psqlsRepository.remove(psql)
    }
}

import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult, updateIntersection } from 'src/common'
import { CreateSeedDto, SeedDto, SeedsQueryDto, UpdateSeedDto } from './dto'
import { Seed } from './entities'
import { SeedsRepository } from './seeds.repository'

@Injectable()
export class SeedsService {
    constructor(private seedsRepository: SeedsRepository) {}

    async createSeed(createSeedDto: CreateSeedDto) {
        const savedSeed = await this.seedsRepository.create(createSeedDto)

        return new SeedDto(savedSeed)
    }

    async seedExists(seedId: string): Promise<boolean> {
        const exists = await this.seedsRepository.exist(seedId)

        return exists
    }

    async findSeeds(queryDto: SeedsQueryDto): Promise<PaginationResult<SeedDto>> {
        const pagedSeeds = await this.seedsRepository.find(queryDto)

        const items = pagedSeeds.items.map((seed) => new SeedDto(seed))

        return { ...pagedSeeds, items }
    }

    async getSeed(seedId: string) {
        const seed = await this._getSeed(seedId)

        return new SeedDto(seed)
    }

    private async _getSeed(seedId: string) {
        const seed = await this.seedsRepository.findById(seedId)

        Assert.defined(seed, `Seed(${seedId}) not found`)

        return seed as Seed
    }

    async updateSeed(seedId: string, updateSeedDto: UpdateSeedDto) {
        const seed = await this._getSeed(seedId)

        const updateSeed = updateIntersection(seed, updateSeedDto)

        const savedSeed = await this.seedsRepository.update(updateSeed)

        Assert.deepEquals(savedSeed, updateSeed, 'update 요청과 결과가 다름')

        return new SeedDto(savedSeed)
    }

    async removeSeed(seedId: string) {
        const seed = await this._getSeed(seedId)

        await this.seedsRepository.remove(seed)
    }
}

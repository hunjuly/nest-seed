import { Injectable } from '@nestjs/common'
import { Assert, LogicException, updateIntersection } from 'src/common'
import { CreateSeedDto, SeedsQueryDto, UpdateSeedDto } from './dto'
import { Seed } from './entities'
import { SeedsRepository } from './seeds.repository'

@Injectable()
export class SeedsService {
    constructor(private seedsRepository: SeedsRepository) {}

    async createSeed(createSeedDto: CreateSeedDto) {
        const savedSeed = await this.seedsRepository.create(createSeedDto)

        return savedSeed
    }

    async seedExists(seedId: string): Promise<boolean> {
        const exists = await this.seedsRepository.exist(seedId)

        return exists
    }

    async findSeeds(queryDto: SeedsQueryDto) {
        const pagedSeeds = await this.seedsRepository.find(queryDto)

        return pagedSeeds
    }

    async getSeed(seedId: string): Promise<Seed> {
        const seed = await this.seedsRepository.findById(seedId)

        if (!seed) {
            throw new LogicException(`Seed(${seedId}) not found`)
        }

        return seed
    }

    async updateSeed(seedId: string, updateSeedDto: UpdateSeedDto) {
        const seed = await this.getSeed(seedId)

        const updatedSeed = updateIntersection(seed, updateSeedDto)

        const savedSeed = await this.seedsRepository.update(updatedSeed)

        Assert.equal(savedSeed, updatedSeed)

        return savedSeed
    }

    async removeSeed(seedId: string) {
        const seed = await this.getSeed(seedId)

        await this.seedsRepository.remove(seed)
    }
}

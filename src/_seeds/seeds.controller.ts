import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common'
import { CreateSeedDto, SeedDto, SeedsQueryDto, UpdateSeedDto } from './dto'
import { SeedsService } from './seeds.service'

@Controller('seeds')
export class SeedsController {
    constructor(private readonly seedsService: SeedsService) {}

    @Post()
    async createSeed(@Body() createSeedDto: CreateSeedDto) {
        const seed = await this.seedsService.createSeed(createSeedDto)

        return new SeedDto(seed)
    }

    @Get()
    async findSeeds(@Query() query: SeedsQueryDto) {
        const pagedSeeds = await this.seedsService.findSeeds(query)

        const items = pagedSeeds.items.map((seed) => new SeedDto(seed))

        return { ...pagedSeeds, items }
    }

    @Get(':seedId')
    async getSeed(@Param('seedId') seedId: string) {
        await this.requireSeedExists(seedId)

        const seed = await this.seedsService.getSeed(seedId)

        return new SeedDto(seed)
    }

    @Patch(':seedId')
    async updateSeed(@Param('seedId') seedId: string, @Body() updateSeedDto: UpdateSeedDto) {
        await this.requireSeedExists(seedId)

        const seed = await this.seedsService.updateSeed(seedId, updateSeedDto)

        return new SeedDto(seed)
    }

    @Delete(':seedId')
    async removeSeed(@Param('seedId') seedId: string) {
        await this.requireSeedExists(seedId)

        await this.seedsService.removeSeed(seedId)
    }

    private async requireSeedExists(seedId: string) {
        const seedExists = await this.seedsService.seedExists(seedId)

        if (!seedExists) {
            throw new NotFoundException(`Seed with ID ${seedId} not found`)
        }
    }
}

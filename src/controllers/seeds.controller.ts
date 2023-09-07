import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common'
import { CreateSeedDto, SeedsQueryDto, UpdateSeedDto } from 'src/_seeds/dto'
import { SeedsService } from 'src/_seeds/seeds.service'

@Controller('seeds')
export class SeedsController {
    constructor(private readonly seedsService: SeedsService) {}

    @Post()
    async createSeed(@Body() createSeedDto: CreateSeedDto) {
        return this.seedsService.createSeed(createSeedDto)
    }

    @Get()
    async findSeeds(@Query() query: SeedsQueryDto) {
        return this.seedsService.findSeeds(query)
    }

    @Get(':seedId')
    async getSeed(@Param('seedId') seedId: string) {
        await this.requireSeedExists(seedId)

        return this.seedsService.getSeed(seedId)
    }

    @Patch(':seedId')
    async updateSeed(@Param('seedId') seedId: string, @Body() updateSeedDto: UpdateSeedDto) {
        await this.requireSeedExists(seedId)

        return this.seedsService.updateSeed(seedId, updateSeedDto)
    }

    @Delete(':seedId')
    async removeSeed(@Param('seedId') seedId: string) {
        await this.requireSeedExists(seedId)

        return this.seedsService.removeSeed(seedId)
    }

    private async requireSeedExists(seedId: string) {
        const seedExists = await this.seedsService.seedExists(seedId)

        if (!seedExists) {
            throw new NotFoundException(`Seed with ID ${seedId} not found`)
        }
    }
}

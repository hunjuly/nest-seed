import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreateSeedDto, SeedsQueryDto, SeedsService, UpdateSeedDto } from 'src/services'
import { SeedExistsGuard } from './guards/seed-exists.guard'

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

    @UseGuards(SeedExistsGuard)
    @Get(':seedId')
    async getSeed(@Param('seedId') seedId: string) {
        return this.seedsService.getSeed(seedId)
    }

    @UseGuards(SeedExistsGuard)
    @Patch(':seedId')
    async updateSeed(@Param('seedId') seedId: string, @Body() updateSeedDto: UpdateSeedDto) {
        return this.seedsService.updateSeed(seedId, updateSeedDto)
    }

    @UseGuards(SeedExistsGuard)
    @Delete(':seedId')
    async removeSeed(@Param('seedId') seedId: string) {
        return this.seedsService.removeSeed(seedId)
    }
}

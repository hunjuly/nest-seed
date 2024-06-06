import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreateMongolDto, MongolsQueryDto, MongolsService, UpdateMongolDto } from 'app/services/mongols'
import { MongolEmailNotExistsGuard, MongolExistsGuard } from './guards'

@Controller('mongols')
export class MongolsController {
    constructor(private readonly mongolsService: MongolsService) {}

    @UseGuards(MongolEmailNotExistsGuard)
    @Post()
    async createMongol(@Body() createMongolDto: CreateMongolDto) {
        return this.mongolsService.createMongol(createMongolDto)
    }

    @Get()
    async findMongols(@Query() query: MongolsQueryDto) {
        return this.mongolsService.findMongols(query)
    }

    @Post('findByIds')
    @HttpCode(200)
    async findByIds(@Body() mongolIds: string[]) {
        return this.mongolsService.findByIds(mongolIds)
    }

    @UseGuards(MongolExistsGuard)
    @Get(':mongolId')
    async getMongol(@Param('mongolId') mongolId: string) {
        return this.mongolsService.getMongol(mongolId)
    }

    @UseGuards(MongolExistsGuard)
    @Patch(':mongolId')
    async updateMongol(@Param('mongolId') mongolId: string, @Body() updateMongolDto: UpdateMongolDto) {
        return this.mongolsService.updateMongol(mongolId, updateMongolDto)
    }

    @UseGuards(MongolExistsGuard)
    @Delete(':mongolId')
    async removeMongol(@Param('mongolId') mongolId: string) {
        return this.mongolsService.removeMongol(mongolId)
    }
}

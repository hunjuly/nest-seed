import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreatePsqlDto, PsqlsQueryDto, PsqlsService, UpdatePsqlDto } from 'src/services'
import { PsqlExistsGuard } from './guards/psql-exists.guard'

@Controller('psqls')
export class PsqlsController {
    constructor(private readonly psqlsService: PsqlsService) {}

    @Post()
    async createPsql(@Body() createPsqlDto: CreatePsqlDto) {
        return this.psqlsService.createPsql(createPsqlDto)
    }

    @Get()
    async findPsqls(@Query() query: PsqlsQueryDto) {
        return this.psqlsService.findPsqls(query)
    }

    @UseGuards(PsqlExistsGuard)
    @Get(':psqlId')
    async getPsql(@Param('psqlId') psqlId: string) {
        return this.psqlsService.getPsql(psqlId)
    }

    @UseGuards(PsqlExistsGuard)
    @Patch(':psqlId')
    async updatePsql(@Param('psqlId') psqlId: string, @Body() updatePsqlDto: UpdatePsqlDto) {
        return this.psqlsService.updatePsql(psqlId, updatePsqlDto)
    }

    @UseGuards(PsqlExistsGuard)
    @Delete(':psqlId')
    async removePsql(@Param('psqlId') psqlId: string) {
        return this.psqlsService.removePsql(psqlId)
    }
}

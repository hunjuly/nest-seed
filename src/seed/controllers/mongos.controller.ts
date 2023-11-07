import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreateMongoDto, MongosQueryDto, MongosService, UpdateMongoDto } from 'seed/services'
import { MongoExistsGuard } from './guards'

@Controller('mongos')
export class MongosController {
    constructor(private readonly mongosService: MongosService) {}

    @Post()
    async createMongo(@Body() createMongoDto: CreateMongoDto) {
        return this.mongosService.createMongo(createMongoDto)
    }

    @Get()
    async findMongos(@Query() query: MongosQueryDto) {
        return this.mongosService.findMongos(query)
    }

    @UseGuards(MongoExistsGuard)
    @Get(':mongoId')
    async getMongo(@Param('mongoId') mongoId: string) {
        return this.mongosService.getMongo(mongoId)
    }

    @UseGuards(MongoExistsGuard)
    @Patch(':mongoId')
    async updateMongo(@Param('mongoId') mongoId: string, @Body() updateMongoDto: UpdateMongoDto) {
        return this.mongosService.updateMongo(mongoId, updateMongoDto)
    }

    @UseGuards(MongoExistsGuard)
    @Delete(':mongoId')
    async removeMongo(@Param('mongoId') mongoId: string) {
        return this.mongosService.removeMongo(mongoId)
    }
}

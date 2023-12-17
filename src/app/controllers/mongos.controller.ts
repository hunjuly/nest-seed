import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreateMongoDto, MongosQueryDto, MongosService, UpdateMongoDto } from 'app/services/mongos'
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

    @Post('/findByIds')
    @HttpCode(200)
    async findByIds(@Body() mongoIds: string[]) {
        return this.mongosService.findByIds(mongoIds)
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

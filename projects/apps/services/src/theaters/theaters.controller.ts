import { Controller } from '@nestjs/common'
import { TheatersService } from './theaters.service'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption, PaginationResult } from 'common'
import { TheaterCreationDto, TheaterUpdatingDto, TheatersQueryDto, TheaterDto } from './dto'

@Controller()
export class TheatersController {
    constructor(private readonly service: TheatersService) {}

    @MessagePattern({ cmd: 'createTheater' })
    async createTheater(createDto: TheaterCreationDto) {
        return this.service.createTheater(createDto)
    }

    @MessagePattern({ cmd: 'updateTheater' })
    async updateTheater({
        theaterId,
        updateDto
    }: {
        theaterId: string
        updateDto: TheaterUpdatingDto
    }) {
        return this.service.updateTheater(theaterId, updateDto)
    }

    @MessagePattern({ cmd: 'deleteTheater' })
    async deleteTheater(theaterId: string) {
        return this.service.deleteTheater(theaterId)
    }

    @MessagePattern({ cmd: 'findTheaters' })
    async findTheaters({
        queryDto,
        pagination
    }: {
        queryDto: TheatersQueryDto
        pagination: PaginationOption
    }): Promise<PaginationResult<TheaterDto>> {
        return this.service.findTheaters(queryDto, pagination)
    }

    @MessagePattern({ cmd: 'findByIds' })
    async findByIds(theaterIds: string[]) {
        return this.service.findByIds(theaterIds)
    }

    @MessagePattern({ cmd: 'getTheater' })
    async getTheater(theaterId: string) {
        return this.service.getTheater(theaterId)
    }

    @MessagePattern({ cmd: 'theatersExist' })
    async theatersExist(theaterIds: string[]): Promise<boolean> {
        return this.service.theatersExist(theaterIds)
    }
}

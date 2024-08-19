import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CreateTheaterDto, QueryTheatersDto, UpdateTheaterDto } from './dto'
import { TheatersService } from './theaters.service'

@Controller()
export class TheatersController {
    constructor(private readonly service: TheatersService) {}

    @MessagePattern({ cmd: 'createTheater' })
    async createTheater(@Payload() createDto: CreateTheaterDto) {
        return this.service.createTheater(createDto)
    }

    @MessagePattern({ cmd: 'updateTheater' })
    async updateTheater(
        @Payload('theaterId') theaterId: string,
        @Payload('updateDto') updateDto: UpdateTheaterDto
    ) {
        return this.service.updateTheater(theaterId, updateDto)
    }

    @MessagePattern({ cmd: 'getTheater' })
    async getTheater(@Payload() theaterId: string) {
        return this.service.getTheater(theaterId)
    }

    @MessagePattern({ cmd: 'deleteTheater' })
    async deleteTheater(@Payload() theaterId: string) {
        return this.service.deleteTheater(theaterId)
    }

    @MessagePattern({ cmd: 'findTheaters' })
    async findTheaters(
        @Payload('query') query: QueryTheatersDto,
        @Payload('pagination') pagination: PaginationOption
    ) {
        return this.service.findTheaters(query ?? {}, pagination ?? {})
    }

    @MessagePattern({ cmd: 'getTheatersByIds' })
    async getTheatersByIds(@Payload() theaterIds: string[]) {
        return this.service.getTheatersByIds(theaterIds)
    }

    @MessagePattern({ cmd: 'theatersExist' })
    async theatersExist(@Payload() theaterIds: string[]) {
        return this.service.theatersExist(theaterIds)
    }
}

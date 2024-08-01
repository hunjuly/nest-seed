import { Injectable } from '@nestjs/common'
import { Assert, MethodLog, PaginationOption, PaginationResult } from 'common'
import { TheaterCreationDto, TheaterDto, TheatersQueryDto, TheaterUpdatingDto } from './dto'
import { TheatersRepository } from './theaters.repository'

@Injectable()
export class TheatersService {
    constructor(private repository: TheatersRepository) {}

    @MethodLog()
    async createTheater(createDto: TheaterCreationDto) {
        const theater = await this.repository.createTheater(createDto)

        return new TheaterDto(theater)
    }

    @MethodLog()
    async updateTheater(theaterId: string, updateTheaterDto: TheaterUpdatingDto) {
        const theater = await this.repository.updateTheater(theaterId, updateTheaterDto)

        return new TheaterDto(theater)
    }

    @MethodLog()
    async deleteTheater(theaterId: string) {
        await this.repository.deleteById(theaterId)
    }

    @MethodLog({ level: 'verbose' })
    async findTheaters(
        queryDto: TheatersQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<TheaterDto>> {
        const paginated = await this.repository.findTheaters(queryDto, pagination)

        return { ...paginated, items: paginated.items.map((item) => new TheaterDto(item)) }
    }

    @MethodLog({ level: 'verbose' })
    async findByIds(theaterIds: string[]) {
        const theaters = await this.repository.findByIds(theaterIds)

        return theaters.map((theater) => new TheaterDto(theater))
    }

    @MethodLog({ level: 'verbose' })
    async getTheater(theaterId: string) {
        const theater = await this.repository.findById(theaterId)

        Assert.defined(theater, `Theater with ID ${theaterId} should exist`)

        return new TheaterDto(theater!)
    }

    async theatersExist(theaterIds: string[]): Promise<boolean> {
        const theaterExists = await this.repository.existsByIds(theaterIds)
        return theaterExists
    }
}

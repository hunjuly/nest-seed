import { Injectable } from '@nestjs/common'
import { DataErrorException, PaginationOption, PaginationResult } from 'common'
import { CreateTheaterDto, TheaterDto, TheatersFilterDto, UpdateTheaterDto } from './dto'
import { TheatersRepository } from './theaters.repository'

@Injectable()
export class TheatersService {
    constructor(private theatersRepository: TheatersRepository) {}

    async createTheater(createTheaterDto: CreateTheaterDto) {
        const savedTheater = await this.theatersRepository.create(createTheaterDto)

        return new TheaterDto(savedTheater)
    }

    async theaterExists(theaterId: string): Promise<boolean> {
        const theaterExists = await this.theatersRepository.existsById(theaterId)

        return theaterExists
    }

    async theatersExist(theaterIds: string[]): Promise<boolean> {
        const theaterExists = await this.theatersRepository.existsByIds(theaterIds)

        return theaterExists
    }

    async findByIds(theaterIds: string[]) {
        const foundTheaters = await this.theatersRepository.findByIds(theaterIds)

        const theaterDtos = foundTheaters.map((theater) => new TheaterDto(theater))

        return theaterDtos
    }

    async findPagedTheaters(
        filterDto: TheatersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<TheaterDto>> {
        const paginatedTheaters = await this.theatersRepository.findPagedTheaters(filterDto, pagination)

        const items = paginatedTheaters.items.map((theater) => new TheaterDto(theater))

        return { ...paginatedTheaters, items }
    }

    async getTheater(theaterId: string) {
        const theater = await this.theatersRepository.findById(theaterId)

        if (!theater) {
            throw new DataErrorException(`Theater(${theaterId}) not found`)
        }

        return new TheaterDto(theater)
    }

    async updateTheater(theaterId: string, updateTheaterDto: UpdateTheaterDto) {
        const savedTheater = await this.theatersRepository.update(theaterId, updateTheaterDto)

        return new TheaterDto(savedTheater)
    }

    async deleteTheater(theaterId: string) {
        await this.theatersRepository.deleteById(theaterId)
    }
}

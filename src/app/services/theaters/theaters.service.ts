import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateTheaterDto, TheaterDto, TheatersQueryDto, UpdateTheaterDto } from './dto'
import { TheatersRepository } from './theaters.repository'
import { Theater } from './schemas'

@Injectable()
export class TheatersService {
    constructor(private theatersRepository: TheatersRepository) {}

    async createTheater(createTheaterDto: CreateTheaterDto) {
        const savedTheater = await this.theatersRepository.create(createTheaterDto)

        return new TheaterDto(savedTheater)
    }

    async doesTheaterExist(theaterId: string): Promise<boolean> {
        const theaterExists = await this.theatersRepository.doesIdExist(theaterId)

        return theaterExists
    }

    async findByIds(theaterIds: string[]) {
        const foundTheaters = await this.theatersRepository.findByIds(theaterIds)

        const theaterDtos = foundTheaters.map((theater) => new TheaterDto(theater))

        return theaterDtos
    }

    async findTheaters(queryDto: TheatersQueryDto): Promise<PaginationResult<TheaterDto>> {
        const paginatedTheaters = await this.theatersRepository.findByQuery(queryDto)

        const items = paginatedTheaters.items.map((theater) => new TheaterDto(theater))

        return { ...paginatedTheaters, items }
    }

    async getTheater(theaterId: string) {
        const theater = await this.getTheaterDocument(theaterId)

        return new TheaterDto(theater)
    }

    private async getTheaterDocument(theaterId: string) {
        const theater = await this.theatersRepository.findById(theaterId)

        Assert.defined(theater, `Theater(${theaterId}) not found`)

        return theater as HydratedDocument<Theater>
    }

    async updateTheater(theaterId: string, updateTheaterDto: UpdateTheaterDto) {
        const savedTheater = await this.theatersRepository.update(theaterId, updateTheaterDto)

        return new TheaterDto(savedTheater)
    }

    async removeTheater(theaterId: string) {
        await this.theatersRepository.remove(theaterId)
    }
}

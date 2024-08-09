import { Injectable, NotFoundException } from '@nestjs/common'
import { Expect, maps, MethodLog, PaginationOption, PaginationResult } from 'common'
import { CreateTheaterDto, QueryTheatersDto, TheaterDto, UpdateTheaterDto } from './dto'
import { TheatersRepository } from './theaters.repository'
import { uniq, differenceWith } from 'lodash'

@Injectable()
export class TheatersService {
    constructor(private repository: TheatersRepository) {}

    @MethodLog()
    async createTheater(createDto: CreateTheaterDto) {
        const theater = await this.repository.createTheater(createDto)
        return new TheaterDto(theater)
    }

    @MethodLog()
    async updateTheater(theaterId: string, updateDto: UpdateTheaterDto) {
        const theater = await this.repository.updateTheater(theaterId, updateDto)
        return new TheaterDto(theater)
    }

    @MethodLog({ level: 'verbose' })
    async getTheater(theaterId: string) {
        const theater = await this.repository.getTheater(theaterId)
        return new TheaterDto(theater)
    }

    @MethodLog()
    async deleteTheater(theaterId: string) {
        await this.repository.deleteTheater(theaterId)
    }

    @MethodLog({ level: 'verbose' })
    async findTheaters(queryDto: QueryTheatersDto, pagination: PaginationOption) {
        const { items, ...paginated } = await this.repository.findTheaters(queryDto, pagination)

        return { ...paginated, items: maps(items, TheaterDto) } as PaginationResult<TheaterDto>
    }

    @MethodLog({ level: 'verbose' })
    async getTheatersByIds(theaterIds: string[]) {
        const uniqueIds = uniq(theaterIds)

        Expect.equalLength(
            uniqueIds,
            theaterIds,
            `Duplicate theater IDs are not allowed:${theaterIds}`
        )

        const theaters = await this.repository.findByIds(uniqueIds)
        const notFoundIds = differenceWith(uniqueIds, theaters, (id, theater) => id === theater.id)

        if (notFoundIds.length > 0) {
            throw new NotFoundException(
                `One or more theaters with IDs ${notFoundIds.join(', ')} not found`
            )
        }

        return maps(theaters, TheaterDto)
    }
}

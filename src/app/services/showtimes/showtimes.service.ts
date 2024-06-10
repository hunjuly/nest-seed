import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateShowtimeDto, ShowtimeDto, ShowtimesQueryDto, UpdateShowtimeDto } from './dto'
import { ShowtimesRepository } from './showtimes.repository'
import { Showtime } from './schemas'

@Injectable()
export class ShowtimesService {
    constructor(private showtimesRepository: ShowtimesRepository) {}

    async createShowtime(createShowtimeDto: CreateShowtimeDto) {
        const savedShowtime = await this.showtimesRepository.create(createShowtimeDto)

        return new ShowtimeDto(savedShowtime)
    }

    async doesShowtimeExist(showtimeId: string): Promise<boolean> {
        const showtimeExists = await this.showtimesRepository.doesIdExist(showtimeId)

        return showtimeExists
    }

    async findByEmail(email: string): Promise<ShowtimeDto | null> {
        const result = await this.showtimesRepository.findByQuery({ email })

        if (1 === result.items.length) {
            return new ShowtimeDto(result.items[0])
        }

        Assert.unique(result.items, `Duplicate email found: '${email}'. Each email must be unique.`)

        return null
    }

    async findByIds(showtimeIds: string[]) {
        const foundShowtimes = await this.showtimesRepository.findByIds(showtimeIds)

        const showtimeDtos = foundShowtimes.map((showtime) => new ShowtimeDto(showtime))

        return showtimeDtos
    }

    async findShowtimes(queryDto: ShowtimesQueryDto): Promise<PaginationResult<ShowtimeDto>> {
        const paginatedShowtimes = await this.showtimesRepository.findByQuery(queryDto)

        const items = paginatedShowtimes.items.map((showtime) => new ShowtimeDto(showtime))

        return { ...paginatedShowtimes, items }
    }

    async getShowtime(showtimeId: string) {
        const showtime = await this.getShowtimeDocument(showtimeId)

        return new ShowtimeDto(showtime)
    }

    private async getShowtimeDocument(showtimeId: string) {
        const showtime = await this.showtimesRepository.findById(showtimeId)

        Assert.defined(showtime, `Showtime(${showtimeId}) not found`)

        return showtime as HydratedDocument<Showtime>
    }

    async updateShowtime(showtimeId: string, updateShowtimeDto: UpdateShowtimeDto) {
        const savedShowtime = await this.showtimesRepository.update(showtimeId, updateShowtimeDto)

        return new ShowtimeDto(savedShowtime)
    }

    async removeShowtime(showtimeId: string) {
        await this.showtimesRepository.remove(showtimeId)
    }
}

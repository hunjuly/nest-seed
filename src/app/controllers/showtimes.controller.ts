import { Body, ConflictException, Controller, Post } from '@nestjs/common'
import { CreateShowtimesRequest, CreateShowtimesStatus, ShowtimesService } from 'app/services/showtimes'

@Controller('showtimes')
export class ShowtimesController {
    constructor(private readonly showtimesService: ShowtimesService) {}

    @Post()
    async createShowtimes(@Body() request: CreateShowtimesRequest) {
        const response = await this.showtimesService.createShowtimes(request)

        if (CreateShowtimesStatus.conflict === response.status) {
            throw new ConflictException(response)
        }

        return response
    }
}

import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { ShowtimesService } from 'app/services/showtimes'

@Injectable()
export class ShowtimeExistsGuard implements CanActivate {
    constructor(private readonly showtimesService: ShowtimesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const showtimeId = request.params.showtimeId

        const showtimeExists = await this.showtimesService.doesShowtimeExist(showtimeId)

        if (!showtimeExists) {
            throw new NotFoundException(`Showtime with ID ${showtimeId} not found`)
        }

        return true
    }
}

import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common'
import { ShowtimesService } from 'app/services/showtimes'

@Injectable()
export class ShowtimeEmailNotExistsGuard implements CanActivate {
    constructor(private readonly showtimesService: ShowtimesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        if (email) {
            const showtime = await this.showtimesService.findByEmail(email)

            if (showtime) {
                throw new ConflictException(`Showtime with email ${email} already exists`)
            }
        }

        return true
    }
}

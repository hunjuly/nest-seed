import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { TheatersService } from 'app/services/theaters'

@Injectable()
export class TheaterExistsGuard implements CanActivate {
    constructor(private readonly theatersService: TheatersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const theaterId = request.query.theaterId || request.params.theaterId

        const theaterExists = await this.theatersService.theatersExist([theaterId])

        if (!theaterExists) {
            throw new NotFoundException(`Theater with ID ${theaterId} not found`)
        }

        return true
    }
}

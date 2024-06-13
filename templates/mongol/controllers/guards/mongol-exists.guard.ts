import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { MongolsService } from 'app/services/mongols'

@Injectable()
export class MongolExistsGuard implements CanActivate {
    constructor(private readonly mongolsService: MongolsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const mongolId = request.query.mongolId || request.params.mongolId

        const mongolExists = await this.mongolsService.doesMongolExist(mongolId)

        if (!mongolExists) {
            throw new NotFoundException(`Mongol with ID ${mongolId} not found`)
        }

        return true
    }
}

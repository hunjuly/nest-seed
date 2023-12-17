import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { MongosService } from 'app/services/mongos'

@Injectable()
export class MongoExistsGuard implements CanActivate {
    constructor(private readonly mongosService: MongosService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const mongoId = request.params.mongoId

        const mongoExists = await this.mongosService.mongoExists(mongoId)

        if (!mongoExists) {
            throw new NotFoundException(`Mongo with ID ${mongoId} not found`)
        }

        return true
    }
}

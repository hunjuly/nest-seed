import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { UsersService } from 'src/services'

@Injectable()
export class UserExistsGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const userId = request.params.userId

        const userExists = await this.usersService.userExists(userId)

        if (!userExists) {
            throw new NotFoundException(`User with ID ${userId} not found`)
        }

        return true
    }
}

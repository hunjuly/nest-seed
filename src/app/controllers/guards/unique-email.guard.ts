import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common'
import { UsersService } from 'app/services/users'

@Injectable()
export class UniqueEmailGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        const emailExists = await this.usersService.emailExists(email)

        if (emailExists) {
            throw new ConflictException(`User with email ${email} already exists`)
        }

        return true
    }
}

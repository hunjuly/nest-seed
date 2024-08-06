import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common'

export function makeHttpException(error: any): HttpException {
    if (typeof error !== 'object' || error === null) {
        return new InternalServerErrorException('Unknown error occurred')
    }

    const { status, message } = error

    switch (status) {
        case 400:
            return new BadRequestException(message)
        case 401:
            return new UnauthorizedException(message)
        case 403:
            return new ForbiddenException(message)
        case 404:
            return new NotFoundException(message)
        case 500:
            return new InternalServerErrorException(message)
        default:
            return new HttpException(message, status || 500)
    }
}

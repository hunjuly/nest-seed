import { ShowtimeDto } from '../../showtimes'

export class ShowtimeSalesStatus extends ShowtimeDto {
    salesStatus: { total: number; sold: number; available: number }
}

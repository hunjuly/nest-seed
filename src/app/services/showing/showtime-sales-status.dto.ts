import { ShowtimeDto } from 'app/services/showtimes'

export class ShowtimeSalesStatus extends ShowtimeDto {
    salesStatus: { total: number; sold: number; available: number }
}

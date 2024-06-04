import { MovieDocument, MovieEnum } from '../schemas'

export class MovieDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: MovieEnum[]
    integer: number
    createdAt: Date
    updatedAt: Date
    version: number

    constructor(movie: MovieDocument) {
        const { id, name, desc, date, enums, integer, createdAt, updatedAt, version } = movie

        Object.assign(this, {
            id,
            name,
            desc,
            date,
            enums,
            integer,
            createdAt,
            updatedAt,
            version
        })
    }
}

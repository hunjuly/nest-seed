import { TicketDto } from 'app/services/tickets'
import { padNumber } from 'common'

export async function createTickets(request: any, count: number): Promise<TicketDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)

        const body = {
            name: `Ticket-${tag}`,
            email: `user-${tag}@mail.com`,
            desc: 'ticket long text',
            date: new Date(2020, 1, i),
            enums: ['EnumA', 'EnumB', 'EnumC'],
            integer: 100
        }

        const promise = request.post({ url: '/tickets', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (300 <= responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

export function sortByName(tickets: TicketDto[]) {
    return tickets.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(tickets: TicketDto[]) {
    return tickets.sort((a, b) => b.name.localeCompare(a.name))
}

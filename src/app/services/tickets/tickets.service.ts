import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateTicketDto, TicketDto, TicketsQueryDto, UpdateTicketDto } from './dto'
import { TicketsRepository } from './tickets.repository'
import { Ticket } from './schemas'

@Injectable()
export class TicketsService {
    constructor(private ticketsRepository: TicketsRepository) {}

    async createTicket(createTicketDto: CreateTicketDto) {
        const savedTicket = await this.ticketsRepository.create(createTicketDto)

        return new TicketDto(savedTicket)
    }

    async doesTicketExist(ticketId: string): Promise<boolean> {
        const ticketExists = await this.ticketsRepository.doesIdExist(ticketId)

        return ticketExists
    }

    async findByEmail(email: string): Promise<TicketDto | null> {
        const result = await this.ticketsRepository.findByQuery({ email })

        if (1 === result.items.length) {
            return new TicketDto(result.items[0])
        }

        Assert.unique(result.items, `Duplicate email found: '${email}'. Each email must be unique.`)

        return null
    }

    async findByIds(ticketIds: string[]) {
        const foundTickets = await this.ticketsRepository.findByIds(ticketIds)

        const ticketDtos = foundTickets.map((ticket) => new TicketDto(ticket))

        return ticketDtos
    }

    async findTickets(queryDto: TicketsQueryDto): Promise<PaginationResult<TicketDto>> {
        const paginatedTickets = await this.ticketsRepository.findByQuery(queryDto)

        const items = paginatedTickets.items.map((ticket) => new TicketDto(ticket))

        return { ...paginatedTickets, items }
    }

    async getTicket(ticketId: string) {
        const ticket = await this.getTicketDocument(ticketId)

        return new TicketDto(ticket)
    }

    private async getTicketDocument(ticketId: string) {
        const ticket = await this.ticketsRepository.findById(ticketId)

        Assert.defined(ticket, `Ticket(${ticketId}) not found`)

        return ticket as HydratedDocument<Ticket>
    }

    async updateTicket(ticketId: string, updateTicketDto: UpdateTicketDto) {
        const savedTicket = await this.ticketsRepository.update(ticketId, updateTicketDto)

        return new TicketDto(savedTicket)
    }

    async removeTicket(ticketId: string) {
        await this.ticketsRepository.remove(ticketId)
    }
}

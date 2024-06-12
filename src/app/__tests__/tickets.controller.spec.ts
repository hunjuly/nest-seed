import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { TicketDto } from 'app/services/tickets'
import { nullObjectId } from 'common'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createTickets, sortByName, sortByNameDescending } from './tickets.controller.fixture'

describe('TicketsController', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let tickets: TicketDto[] = []
    let ticket: TicketDto

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        tickets = await createTickets(req, 100)
        ticket = tickets[0]
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    describe('POST /tickets', () => {
        const createTicketDto = {
            name: 'ticket name',
            email: 'user@mail.com',
            desc: 'ticket long text',
            date: new Date('2020-12-12'),
            enums: ['EnumA', 'EnumB', 'EnumC'],
            integer: 100
        }

        it('Create a ticket', async () => {
            const res = await req.post({ url: '/tickets', body: createTicketDto })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createTicketDto
            })
        })

        it('CONFLICT(409) if email already exists', async () => {
            const res = await req.post({
                url: '/tickets',
                body: { ...createTicketDto, email: ticket.email }
            })

            expect(res.statusCode).toEqual(HttpStatus.CONFLICT)
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/tickets',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /tickets/:id', () => {
        it('Update a ticket', async () => {
            const updateData = {
                name: 'update name',
                email: 'new@mail.com',
                desc: 'update long text',
                date: new Date('2000-12-12'),
                enums: ['EnumC', 'EnumD', 'EnumE'],
                integer: 999
            }

            const updateResponse = await req.patch({ url: `/tickets/${ticket.id}`, body: updateData })
            expect(updateResponse.status).toEqual(HttpStatus.OK)

            const getResponse = await req.get({ url: `/tickets/${ticket.id}` })

            expect(updateResponse.body).toEqual({ ...ticket, ...updateData })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/tickets/${ticket.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
        })

        it('NOT_FOUND(404) if ticket is not found', async () => {
            const res = await req.patch({
                url: `/tickets/${nullObjectId}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('DELETE /tickets/:id', () => {
        it('Delete a ticket', async () => {
            const deleteResponse = await req.delete({ url: `/tickets/${ticket.id}` })
            const getResponse = await req.get({ url: `/tickets/${ticket.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if ticket is not found', async () => {
            const res = await req.delete({ url: `/tickets/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })

    describe('GET /tickets', () => {
        it('Retrieve all tickets', async () => {
            const res = await req.get({
                url: '/tickets',
                query: { orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(tickets)
        })

        it('Retrieve tickets by name', async () => {
            const res = await req.get({
                url: '/tickets',
                query: { name: ticket.name }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([ticket])
        })

        it('Retrieve tickets by partial name', async () => {
            const res = await req.get({
                url: '/tickets',
                query: { name: 'Ticket-' }
            })

            sortByName(res.body.items)
            sortByName(tickets)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(tickets)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50

            const res = await req.get({
                url: '/tickets',
                query: { skip, take, orderby: 'name:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({
                items: tickets.slice(skip, skip + take),
                total: tickets.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/tickets',
                query: { orderby: 'name:asc' }
            })

            sortByName(tickets)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(tickets)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/tickets',
                query: { orderby: 'name:desc' }
            })

            sortByNameDescending(tickets)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(tickets)
        })
    })

    describe('POST /tickets/findByIds', () => {
        it('Retrieve tickets by multiple IDs', async () => {
            const ticketIds = tickets.map((ticket) => ticket.id)

            const res = await req.post({
                url: '/tickets/findByIds',
                body: ticketIds
            })

            sortByName(res.body)
            sortByName(tickets)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(tickets)
        })
    })

    describe('GET /tickets/:id', () => {
        it('Retrieve a ticket by ID', async () => {
            const res = await req.get({ url: `/tickets/${ticket.id}` })

            expect(res.status).toEqual(HttpStatus.OK)
            expect(res.body).toEqual(ticket)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/tickets/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
        })
    })
})

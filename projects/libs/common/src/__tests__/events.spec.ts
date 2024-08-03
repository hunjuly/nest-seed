import { EventEmitterModule } from '@nestjs/event-emitter'
import { TestingModule } from '@nestjs/testing'
import { createTestingModule } from 'common/test'
import { AppEventListener, SampleEvent } from './events.fixture'

describe('AppEvent', () => {
    let module: TestingModule
    let eventListener: AppEventListener

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })],
            providers: [AppEventListener]
        })
        const app = module.createNestApplication()
        await app.init()

        eventListener = module.get(AppEventListener)
    })

    afterEach(async () => {
        await module?.close()
        jest.restoreAllMocks()
    })

    it('emits and receives a specific event', async () => {
        const spy = jest.spyOn(eventListener, 'onSampleEvent')

        await eventListener.emitEvent(new SampleEvent('event'))

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ text: 'event' }))
    })

    it('emits and receives an event matching a wildcard pattern', async () => {
        const spy = jest.spyOn(eventListener, 'onWildEvent')

        await eventListener.emitEvent(new SampleEvent('event'))

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ text: 'event' }))
    })

    it('emits and receives any event', async () => {
        const spy = jest.spyOn(eventListener, 'onAnyEvent')

        await eventListener.emitEvent(new SampleEvent('event'))

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ text: 'event' }))
    })
})

import * as bull from 'bull'
import { Coordinates } from 'common'
import {
    Password,
    addQuotesToNumbers,
    comment,
    coordinatesDistanceInMeters,
    equalsIgnoreCase,
    generateUUID,
    notUsed,
    sleep,
    parseObjectTypes,
    waitForQueueToEmpty
} from '..'

jest.mock('bull')

describe('waitForQueueToEmpty', () => {
    it('should complete when the queue is empty', async () => {
        const mockQueue = new bull('') as any
        mockQueue.getActiveCount = jest.fn().mockResolvedValue(0)
        mockQueue.getWaitingCount = jest.fn().mockResolvedValue(0)

        const result = await waitForQueueToEmpty(mockQueue)
        expect(result).toBeTruthy()
    })

    it('should time out if the queue is not empty within the time limit', async () => {
        const mockQueue = new bull('') as any
        mockQueue.getActiveCount = jest.fn().mockResolvedValue(1)
        mockQueue.getWaitingCount = jest.fn().mockResolvedValue(1)

        const result = await waitForQueueToEmpty(mockQueue, 1)
        expect(result).toBeFalsy()
    })
})

describe('common/utils/etc', () => {
    describe('sleep', () => {
        it('sleeps for the given amount of time', async () => {
            const start = Date.now()
            const timeout = 1000

            await sleep(timeout)

            const end = Date.now()
            const elapsed = end - start

            // Since the timeout is set to 1000, it should execute around 1000, so the range is set to +-100
            expect(elapsed).toBeGreaterThan(timeout - 100)
            expect(elapsed).toBeLessThan(timeout + 100)
        })
    })

    describe('generateUUID', () => {
        it('generates a UUID', () => {
            const uuid = generateUUID()
            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

            expect(uuid).toMatch(regex)
        })

        it('UUID should be different each time it is generated', () => {
            const uuid1 = generateUUID()
            const uuid2 = generateUUID()

            expect(uuid1).not.toEqual(uuid2)
        })
    })

    describe('Password', () => {
        it('hashes the password', async () => {
            const password = 'password'
            const hashedPassword = await Password.hash(password)

            expect(hashedPassword).not.toEqual(password)
        })

        it('returns true if the password matches', async () => {
            const password = 'password'
            const hashedPassword = await Password.hash(password)

            const isValidPassword = await Password.validate(password, hashedPassword)

            expect(isValidPassword).toBeTruthy()
        })

        it('returns false if the password does not match', async () => {
            const password = 'password'
            const hashedPassword = await Password.hash(password)

            const isValidPassword = await Password.validate('wrongpassword', hashedPassword)

            expect(isValidPassword).toBeFalsy()
        })
    })

    describe('coordinatesDistanceInMeters', () => {
        it('calculates the distance between two coordinates in meters', () => {
            // coordinates for Seoul, South Korea
            const seoul: Coordinates = {
                latitude: 37.5665,
                longitude: 126.978
            }

            // coordinates for Busan, South Korea
            const busan: Coordinates = {
                latitude: 35.1796,
                longitude: 129.0756
            }

            // approximate distance in meters between Seoul and Busan
            // it's about 325 km, but the actual value can vary based on the exact coordinates
            const expectedDistance = 325000

            // get the result from our function
            const actualDistance = coordinatesDistanceInMeters(seoul, busan)

            // define our tolerance (5% in this case)
            const tolerance = 0.05 * expectedDistance

            // check if the actual distance is within the expected range
            expect(actualDistance).toBeGreaterThan(expectedDistance - tolerance)
            expect(actualDistance).toBeLessThan(expectedDistance + tolerance)
        })
    })

    describe('addQuotesToNumbers', () => {
        it('converts 64-bit integers to strings in a JSON string', () => {
            const text = '[{"bit64":12345678901234567890}]'
            const processedText = addQuotesToNumbers(text)
            const data = JSON.parse(processedText)

            expect(data[0].bit64).toEqual('12345678901234567890')
        })

        it('converts 32-bit integers to strings in a JSON string', () => {
            const text = '[{"bit32":123456}]'
            const processedText = addQuotesToNumbers(text)
            const data = JSON.parse(processedText)

            expect(data[0].bit32).toEqual('123456')
        })
    })

    describe('equalsIgnoreCase', () => {
        it('returns true for two strings with different case', () => {
            const isEqual = equalsIgnoreCase('hello', 'HELLO')

            expect(isEqual).toBeTruthy()
        })

        it('returns false if the two strings are different', () => {
            const isEqual = equalsIgnoreCase('hello', 'world')

            expect(isEqual).toBeFalsy()
        })

        it('returns false if both inputs are undefined', () => {
            const isEqual = equalsIgnoreCase(undefined, undefined)

            expect(isEqual).toBeFalsy()
        })
    })

    describe('parseObjectTypes', () => {
        it('converts ISO 8601 date strings to Date objects', () => {
            const obj = {
                date: '2023-06-18T12:00:00.000Z'
            }
            parseObjectTypes(obj)
            expect(obj.date).toBeInstanceOf(Date)
            expect((obj.date as any).toISOString()).toEqual('2023-06-18T12:00:00.000Z')
        })

        it('recursively converts date strings in nested objects', () => {
            const obj = {
                level1: {
                    date: '2023-06-18T12:00:00.000Z',
                    level2: {
                        date: '2023-06-19T12:00:00.000Z'
                    }
                }
            }
            parseObjectTypes(obj)
            expect(obj.level1.date).toBeInstanceOf(Date)
            expect((obj.level1.date as any).toISOString()).toEqual('2023-06-18T12:00:00.000Z')
            expect(obj.level1.level2.date).toBeInstanceOf(Date)
            expect((obj.level1.level2.date as any).toISOString()).toEqual('2023-06-19T12:00:00.000Z')
        })

        it('ignores non-date string formats', () => {
            const obj = {
                text: 'Hello, world!'
            }
            parseObjectTypes(obj)
            expect(obj.text).toEqual('Hello, world!')
        })

        it('ignores non-string types', () => {
            const obj = {
                number: 123,
                boolean: true
            }
            parseObjectTypes(obj)
            expect(obj.number).toEqual(123)
            expect(obj.boolean).toBe(true)
        })
    })

    describe('for coverage', () => {
        notUsed()
        comment()
    })
})

import { Coordinates, UserException } from 'common'
import {
    Password,
    addQuotesToNumbers,
    comment,
    convertMillisToString,
    convertStringToMillis,
    coordinatesDistanceInMeters,
    equalsIgnoreCase,
    generateUUID,
    notUsed,
    sleep
} from '..'

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

    // describe('updateIntersection', () => {
    //     it('updates obj1 with the common properties of obj1 and obj2', () => {
    //         const obj1 = { name: 'Alice', age: 30, address: '123 Main St' }
    //         const obj2 = { name: 'Bob', age: 25, phone: '555-5555' }
    //         const result = updateIntersection(obj1, obj2)

    //         expect(result).toEqual({ name: 'Bob', age: 25, address: '123 Main St' })
    //     })

    //     it('returns obj1 if there are no common properties between obj1 and obj2', () => {
    //         const obj1 = { name: 'Alice', age: 30 }
    //         const obj2 = { phone: '555-5555', email: 'alice@example.com' }
    //         const result = updateIntersection(obj1, obj2)

    //         expect(result).toEqual(obj1)
    //     })
    // })

    describe('convertStringToMillis', () => {
        it('30m == 30*60*1000', () => {
            const result = convertStringToMillis('30m')
            expect(result).toEqual(30 * 60 * 1000)
        })

        it('45s == 45*1000', () => {
            const result = convertStringToMillis('45s')
            expect(result).toEqual(45 * 1000)
        })

        it('1d == 24*60*60*1000', () => {
            const result = convertStringToMillis('1d')
            expect(result).toEqual(24 * 60 * 60 * 1000)
        })

        it('2h == 2*60*60*1000', () => {
            const result = convertStringToMillis('2h')
            expect(result).toEqual(2 * 60 * 60 * 1000)
        })

        it('1d 2h == (24+2)*60*60*1000', () => {
            const result = convertStringToMillis('1d 2h')
            expect(result).toEqual((24 + 2) * 60 * 60 * 1000)
        })

        it('1d2h == (24+2)*60*60*1000', () => {
            const result = convertStringToMillis('1d2h')
            expect(result).toEqual((24 + 2) * 60 * 60 * 1000)
        })

        it('-30s == -30*1000', () => {
            const result = convertStringToMillis('-30s')
            expect(result).toEqual(-30 * 1000)
        })

        it('0.5s == 0.5*1000', () => {
            const result = convertStringToMillis('0.5s')
            expect(result).toEqual(0.5 * 1000)
        })

        it('500ms == 500', () => {
            const result = convertStringToMillis('500ms')
            expect(result).toEqual(500)
        })

        it('throws an UserException if the format is invalid', () => {
            expect(() => convertStringToMillis('2z')).toThrow(UserException)
        })
    })

    describe('convertMillisToString', () => {
        it('30*60*1000 == 30m', () => {
            const result = convertMillisToString(30 * 60 * 1000)
            expect(result).toEqual('30m')
        })

        it('45*1000 == 45s', () => {
            const result = convertMillisToString(45 * 1000)
            expect(result).toEqual('45s')
        })

        it('24*60*60*1000 == 1d', () => {
            const result = convertMillisToString(24 * 60 * 60 * 1000)
            expect(result).toEqual('1d')
        })

        it('2*60*60*1000 == 2h', () => {
            const result = convertMillisToString(2 * 60 * 60 * 1000)
            expect(result).toEqual('2h')
        })

        it('(24+2)*60*60*1000 == 1d2h', () => {
            const result = convertMillisToString((24 + 2) * 60 * 60 * 1000)
            expect(result).toEqual('1d2h')
        })

        it('500ms == 500', () => {
            const result = convertMillisToString(500)
            expect(result).toEqual('500ms')
        })

        it('0ms == 0', () => {
            const result = convertMillisToString(0)
            expect(result).toEqual('0ms')
        })

        it('-30*1000 == -30s', () => {
            const result = convertMillisToString(-30 * 1000)
            expect(result).toEqual('-30s')
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

    describe('for coverage', () => {
        notUsed()
        comment()
    })
})

import { Coordinate } from '../../interfaces'
import {
    addQuotesToNumbers,
    convertTimeToSeconds,
    coordinateDistanceInMeters,
    equalsIgnoreCase,
    generateUUID,
    hashPassword,
    sleep,
    updateIntersection,
    validatePassword
} from '../etc'

describe('common/utils/etc', () => {
    describe('sleep', () => {
        it('should wait for the given time', async () => {
            const start = Date.now()
            const timeout = 1000

            await sleep(timeout)

            const end = Date.now()
            const elapsed = end - start

            // timeout을 1000으로 설정했다면 1000 전후에 실행되기 때문에 90% 범위로 설정했다.
            expect(elapsed).toBeGreaterThanOrEqual(timeout * 0.9)
        })
    })

    describe('generateUUID', () => {
        it('should generate a UUID with the correct format', () => {
            const uuid = generateUUID()
            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

            expect(uuid).toMatch(regex)
        })

        it('should generate a different UUID every time', () => {
            const uuid1 = generateUUID()
            const uuid2 = generateUUID()

            expect(uuid1).not.toEqual(uuid2)
        })

        it('handles browsers without support for performance', () => {
            ;(global as any).performance = undefined

            const uuid1 = generateUUID()

            delete (global as any).performance

            expect(uuid1).toBeDefined()
        })
    })

    describe('updateIntersection', () => {
        it('should update the intersection of two objects', () => {
            const obj1 = { name: 'Alice', age: 30, address: '123 Main St' }
            const obj2 = { name: 'Bob', age: 25, phone: '555-5555' }
            const result = updateIntersection(obj1, obj2)

            expect(result).toEqual({ name: 'Bob', age: 25, address: '123 Main St' })
        })

        it('should return the first object if there is no intersection', () => {
            const obj1 = { name: 'Alice', age: 30 }
            const obj2 = { phone: '555-5555', email: 'alice@example.com' }
            const result = updateIntersection(obj1, obj2)

            expect(result).toEqual(obj1)
        })
    })

    describe('convertTimeToSeconds', () => {
        it('should convert 1d to 86400 seconds', () => {
            const result = convertTimeToSeconds('1d')
            expect(result).toBe(86400)
        })

        it('should convert 2h to 7200 seconds', () => {
            const result = convertTimeToSeconds('2h')
            expect(result).toBe(7200)
        })

        it('should convert 30m to 1800 seconds', () => {
            const result = convertTimeToSeconds('30m')
            expect(result).toBe(1800)
        })

        it('should convert 45s to 45 seconds', () => {
            const result = convertTimeToSeconds('45s')
            expect(result).toBe(45)
        })

        it('should convert 1d 2h to 93600 seconds', () => {
            const result = convertTimeToSeconds('1d 2h')
            expect(result).toBe(93600)
        })

        it('should throw an error if the input is invalid', () => {
            expect(() => convertTimeToSeconds('invalid')).toThrowError('Invalid time string')
        })
    })

    describe('hash', () => {
        describe('hashPassword', () => {
            it('should hash the password', async () => {
                const password = 'password'
                const hashedPassword = await hashPassword(password)

                expect(hashedPassword).not.toEqual(password)
            })
        })

        it('should return true for matching passwords', async () => {
            const password = 'password'
            const hashedPassword = await hashPassword(password)

            const isValidPassword = await validatePassword(password, hashedPassword)

            expect(isValidPassword).toBe(true)
        })

        it('should return false for non-matching passwords', async () => {
            const password = 'password'
            const hashedPassword = await hashPassword(password)

            const isValidPassword = await validatePassword('wrongpassword', hashedPassword)

            expect(isValidPassword).toBe(false)
        })
    })

    describe('coordinateDistanceInMeters', () => {
        it('should correctly calculate the distance between two coordinates', () => {
            // coordinates for Seoul, South Korea
            const seoul: Coordinate = {
                latitude: 37.5665,
                longitude: 126.978
            }

            // coordinates for Busan, South Korea
            const busan: Coordinate = {
                latitude: 35.1796,
                longitude: 129.0756
            }

            // approximate distance in meters between Seoul and Busan
            // it's about 325 km, but the actual value can vary based on the exact coordinates
            const expectedDistance = 325000

            // get the result from our function
            const actualDistance = coordinateDistanceInMeters(seoul, busan)

            // define our tolerance (5% in this case)
            const tolerance = 0.05 * expectedDistance

            // check if the actual distance is within the expected range
            expect(actualDistance).toBeGreaterThan(expectedDistance - tolerance)
            expect(actualDistance).toBeLessThan(expectedDistance + tolerance)
        })
    })

    describe('addQuotesToNumbers', () => {
        it('64bit 정수를 올바르게 변환해야 한다', () => {
            const text =
                '[{"id":12345678901234567890,"_text_id":"12345678901234567890","scene_sid":"LGrP789","slug":1234, \
    "scene_owned_file_id":22345678901234567890,"attributions":{"content": [], "creator": ""},"reviewed_at":null}]'

            // 따옴표를 추가하여 처리
            const processedText = addQuotesToNumbers(text)

            const data = JSON.parse(processedText)

            expect(data[0].id).toBe('12345678901234567890')
        })
    })

    describe('equalsIgnoreCase', () => {
        it('should return true for two strings that are equal except for case', () => {
            const isEqual = equalsIgnoreCase('hello', 'HELLO')

            expect(isEqual).toBeTruthy()
        })

        it('should return false for two strings that are not equal', () => {
            const isEqual = equalsIgnoreCase('hello', 'world')

            expect(isEqual).toBeFalsy()
        })

        it('should return false for undefined', () => {
            const isEqual = equalsIgnoreCase(undefined, undefined)

            expect(isEqual).toBeFalsy()
        })
    })
})

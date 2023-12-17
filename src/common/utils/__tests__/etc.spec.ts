import { Coordinate, InvalidArgumentException } from 'common'
import {
    Password,
    addQuotesToNumbers,
    comment,
    convertMillisToString,
    convertStringToMillis,
    coordinateDistanceInMeters,
    equalsIgnoreCase,
    generateUUID,
    notUsed,
    sleep,
    updateIntersection
} from '..'

describe('common/utils/etc', () => {
    describe('sleep', () => {
        it('주어진 시간 동안 sleep한다', async () => {
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
        it('UUID를 생성한다', () => {
            const uuid = generateUUID()
            const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

            expect(uuid).toMatch(regex)
        })

        it('생성할 때 마다 UUID는 달라야 한다', () => {
            const uuid1 = generateUUID()
            const uuid2 = generateUUID()

            expect(uuid1).not.toEqual(uuid2)
        })
    })

    describe('updateIntersection', () => {
        it('obj1, obj2의 공통된 항목을 obj1에 업데이트 한다', () => {
            const obj1 = { name: 'Alice', age: 30, address: '123 Main St' }
            const obj2 = { name: 'Bob', age: 25, phone: '555-5555' }
            const result = updateIntersection(obj1, obj2)

            expect(result).toEqual({ name: 'Bob', age: 25, address: '123 Main St' })
        })

        it('obj1, obj2의 공통된 항목이 없으면 obj1을 반환한다', () => {
            const obj1 = { name: 'Alice', age: 30 }
            const obj2 = { phone: '555-5555', email: 'alice@example.com' }
            const result = updateIntersection(obj1, obj2)

            expect(result).toEqual(obj1)
        })
    })

    describe('convertStringToMillis', () => {
        it('30m === 30*60*1000', () => {
            const result = convertStringToMillis('30m')
            expect(result).toEqual(30 * 60 * 1000)
        })

        it('45s === 45*1000', () => {
            const result = convertStringToMillis('45s')
            expect(result).toEqual(45 * 1000)
        })

        it('1d === 24*60*60*1000', () => {
            const result = convertStringToMillis('1d')
            expect(result).toEqual(24 * 60 * 60 * 1000)
        })

        it('2h === 2*60*60*1000', () => {
            const result = convertStringToMillis('2h')
            expect(result).toEqual(2 * 60 * 60 * 1000)
        })

        it('1d 2h === (24+2)*60*60*1000', () => {
            const result = convertStringToMillis('1d 2h')
            expect(result).toEqual((24 + 2) * 60 * 60 * 1000)
        })

        it('1d2h === (24+2)*60*60*1000', () => {
            const result = convertStringToMillis('1d2h')
            expect(result).toEqual((24 + 2) * 60 * 60 * 1000)
        })

        it('-30s === -30*1000', () => {
            const result = convertStringToMillis('-30s')
            expect(result).toEqual(-30 * 1000)
        })

        it('0.5s === 0.5*1000', () => {
            const result = convertStringToMillis('0.5s')
            expect(result).toEqual(0.5 * 1000)
        })

        it('500ms === 500', () => {
            const result = convertStringToMillis('500ms')
            expect(result).toEqual(500)
        })

        it('형식에 맞지 않으면 Error', () => {
            expect(() => convertStringToMillis('2z')).toThrow(InvalidArgumentException)
        })
    })

    describe('convertMillisToString', () => {
        it('30*60*1000 === 30m', () => {
            const result = convertMillisToString(30 * 60 * 1000)
            expect(result).toEqual('30m')
        })

        it('45*1000 === 45s', () => {
            const result = convertMillisToString(45 * 1000)
            expect(result).toEqual('45s')
        })

        it('24*60*60*1000 === 1d', () => {
            const result = convertMillisToString(24 * 60 * 60 * 1000)
            expect(result).toEqual('1d')
        })

        it('2*60*60*1000 === 2h', () => {
            const result = convertMillisToString(2 * 60 * 60 * 1000)
            expect(result).toEqual('2h')
        })

        it('(24+2)*60*60*1000 === 1d2h', () => {
            const result = convertMillisToString((24 + 2) * 60 * 60 * 1000)
            expect(result).toEqual('1d2h')
        })

        it('500ms === 500', () => {
            const result = convertMillisToString(500)
            expect(result).toEqual('500ms')
        })

        it('0ms === 0', () => {
            const result = convertMillisToString(0)
            expect(result).toEqual('0ms')
        })

        it('-30*1000 === -30s', () => {
            const result = convertMillisToString(-30 * 1000)
            expect(result).toEqual('-30s')
        })
    })

    describe('Password', () => {
        it('password를 hash한다', async () => {
            const password = 'password'
            const hashedPassword = await Password.hash(password)

            expect(hashedPassword).not.toEqual(password)
        })

        it('password가 일치하면 true 반환', async () => {
            const password = 'password'
            const hashedPassword = await Password.hash(password)

            const isValidPassword = await Password.validate(password, hashedPassword)

            expect(isValidPassword).toEqual(true)
        })

        it('password가 일치하지 않으면 false 반환', async () => {
            const password = 'password'
            const hashedPassword = await Password.hash(password)

            const isValidPassword = await Password.validate('wrongpassword', hashedPassword)

            expect(isValidPassword).toEqual(false)
        })
    })

    describe('coordinateDistanceInMeters', () => {
        it('두 좌표의 거리를 meter 단위로 계산한다', () => {
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
        it('json문자열에서 64bit 정수를 문자열로 변환한다', () => {
            const text = '[{"bit64":12345678901234567890}]'
            const processedText = addQuotesToNumbers(text)
            const data = JSON.parse(processedText)

            expect(data[0].bit64).toEqual('12345678901234567890')
        })

        it('json문자열에서 32bit 정수를 문자열로 변환한다', () => {
            const text = '[{"bit32":123456}]'
            const processedText = addQuotesToNumbers(text)
            const data = JSON.parse(processedText)

            expect(data[0].bit32).toEqual('123456')
        })
    })

    describe('equalsIgnoreCase', () => {
        it('대소문자가 다른 두 문자열은 true를 반환한다', () => {
            const isEqual = equalsIgnoreCase('hello', 'HELLO')

            expect(isEqual).toBeTruthy()
        })

        it('두 문자열이 다르면 false를 반환한다', () => {
            const isEqual = equalsIgnoreCase('hello', 'world')

            expect(isEqual).toBeFalsy()
        })

        it('두 입력값이 undefined면 false를 리턴한다', () => {
            const isEqual = equalsIgnoreCase(undefined, undefined)

            expect(isEqual).toBeFalsy()
        })
    })

    describe('for coverage', () => {
        notUsed()
        comment()
    })
})

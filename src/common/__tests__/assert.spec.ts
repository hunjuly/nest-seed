import { Assert, LogicException } from '..'

describe('Assert', () => {
    describe('sameLength', () => {
        it('The two arrays are the same length', () => {
            const a = [1, 1, 1]
            const b = [1, 1, 1]

            expect(() => Assert.sameLength(a, b, 'error messages')).not.toThrow()
        })

        it('If the two arrays are different, throw a LogicException', () => {
            const a = [1, 1]
            const b = [1]

            expect(() => Assert.sameLength(a, b, 'error message')).toThrow(LogicException)
        })
    })

    describe('equals', () => {
        it('The two values are the same', () => {
            const a = 10
            const b = 10

            expect(() => Assert.equals(a, b, 'error messages')).not.toThrow()
        })

        it('If the two values are different, throw a LogicException', () => {
            const a = 10
            const b = 20

            expect(() => Assert.equals(a, b, 'error message')).toThrow(LogicException)
        })
    })

    describe('defined', () => {
        it('The value should be valid', () => {
            const value = 'test'

            expect(() => Assert.defined(value, 'error message')).not.toThrow()
        })

        it('If the value is not valid, throw a LogicException', () => {
            const value = undefined

            expect(() => Assert.defined(value, 'error message')).toThrow(LogicException)
        })
    })

    describe('undefined', () => {
        it('The value should be undefined', () => {
            const value = undefined

            expect(() => Assert.undefined(value, 'error message')).not.toThrow()
        })

        it('If the value is valid, throw a LogicException', () => {
            const value = null

            expect(() => Assert.undefined(value, 'error message')).toThrow(LogicException)
        })
    })

    describe('notDefined', () => {
        it('The value should be null|undefined', () => {
            const value = null

            expect(() => Assert.notDefined(value, 'error message')).not.toThrow()
        })

        it('If the value is valid, throw a LogicException', () => {
            const value = 'test'

            expect(() => Assert.notDefined(value, 'error message')).toThrow(LogicException)
        })
    })

    describe('truthy', () => {
        it('The value should be true', () => {
            expect(() => Assert.truthy(true, 'error message')).not.toThrow()
        })

        it('If it is not true, throw a LogicException', () => {
            expect(() => Assert.truthy(false, 'error message')).toThrow(LogicException)
        })
    })

    describe('falsy', () => {
        it('The value should be false', () => {
            expect(() => Assert.falsy(false, 'error message')).not.toThrow()
        })

        it('If it is not false, throw a LogicException', () => {
            expect(() => Assert.falsy(true, 'error message')).toThrow(LogicException)
        })
    })

    describe('unique', () => {
        it('The value should be 1 or less', () => {
            expect(() => Assert.unique([''], 'error message')).not.toThrow()
        })

        it('If there are 2 or more values, throw a LogicException', () => {
            expect(() => Assert.unique(['', ''], 'error message')).toThrow(LogicException)
        })
    })
})

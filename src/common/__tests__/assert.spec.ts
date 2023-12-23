import { Assert, FatalException, LogicException } from '..'

describe('Assert', () => {
    describe('deepEquals', () => {
        it('두 값이 같다', () => {
            const a = 10
            const b = 10

            expect(() => Assert.deepEquals(a, b, 'error messages')).not.toThrow()
        })

        it('두 값이 다르면 LogicException', () => {
            const a = 10
            const b = 20

            expect(() => Assert.deepEquals(a, b, 'error message')).toThrow(LogicException)
        })
    })

    describe('defined', () => {
        it('값은 유효해야 한다', () => {
            const value = 'test'

            expect(() => Assert.defined(value, 'error message')).not.toThrow()
        })

        it('값이 유효하지 않으면 LogicException', () => {
            const value = undefined

            expect(() => Assert.defined(value, 'error message')).toThrow(LogicException)
        })
    })

    describe('undefined', () => {
        it('값이 없어야 한다', () => {
            const value = undefined

            expect(() => Assert.undefined(value, 'error message')).not.toThrow()
        })

        it('값이 유효하면 LogicException', () => {
            const value = 'test'

            expect(() => Assert.undefined(value, 'error message')).toThrow(LogicException)
        })
    })

    describe('truthy', () => {
        it('값은 true여야 한다', () => {
            expect(() => Assert.truthy(true, 'error message')).not.toThrow()
        })

        it('true가 아니라면 LogicException', () => {
            expect(() => Assert.truthy(false, 'error message')).toThrow(LogicException)
        })
    })

    describe('falsy', () => {
        it('값은 false여야 한다', () => {
            expect(() => Assert.falsy(false, 'error message')).not.toThrow()
        })

        it('false 아니라면 LogicException', () => {
            expect(() => Assert.falsy(true, 'error message')).toThrow(LogicException)
        })
    })
})

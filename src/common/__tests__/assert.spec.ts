import { Assert } from '../assert'
import { LogicException } from '../exceptions'

describe('Assert', () => {
    describe('equal', () => {
        it('should not throw an error when values are equal', () => {
            const a = 10
            const b = 10

            expect(() => Assert.equal(a, b)).not.toThrow()
        })

        it('should throw a LogicException when values are not equal', () => {
            const a = 10
            const b = 20

            expect(() => Assert.equal(a, b)).toThrow(LogicException)
        })

        it('should include the custom message in the thrown error', () => {
            const a = 'hello'
            const b = 'world'
            const message = 'Custom message'

            expect(() => Assert.equal(a, b, message)).toThrowError(
                `Assert.equal failed: "hello" !== "world", ${message}`
            )
        })
    })

    describe('defined', () => {
        it('should not throw an error when value is defined', () => {
            const value = 'test'

            expect(() => Assert.defined(value, 'Value is not defined')).not.toThrow()
        })

        it('should throw a LogicException when value is not defined', () => {
            const value = undefined

            expect(() => Assert.defined(value, 'Value is not defined')).toThrow(LogicException)
        })
    })
})

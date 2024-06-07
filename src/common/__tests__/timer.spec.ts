/**
 * Jest's fake timer mocks JavaScript's timer functions such as setTimeout, setInterval, setImmediate,
 * allowing for immediate execution or manipulation of execution times without waiting for real time.
 *
 * However, this does not work for all asynchronous operations in Node.js,
 * and especially asynchronous operations provided by external libraries may not function as expected.
 */

describe('Timer', () => {
    beforeEach(async () => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.useRealTimers()
    })

    test('Check if the timer function is properly mocked', () => {
        const mockCallback = jest.fn()

        setTimeout(() => mockCallback('Real value'), 1000)

        expect(mockCallback).not.toHaveBeenCalledWith('Real value')

        jest.advanceTimersByTime(1000)

        expect(mockCallback).toHaveBeenCalledWith('Real value')
    })
})

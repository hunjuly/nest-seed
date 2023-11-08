import * as myModule from './timer'

/**
 * Jest의 fake timer는 JavaScript의 setTimeout, setInterval, setImmediate와 같은
 * 타이머 함수들을 mocking하여 실제 시간을 기다리지 않고 바로 실행시키거나 실행 시간을 조작할 수 있게 합니다.
 * 그러나 이는 Node.js의 모든 비동기 작업에 대해 동작하는 것이 아니며,
 * 특히 외부 라이브러리에서 제공하는 비동기 작업들은 동작하지 않을 수 있습니다.
 */
describe('Timer', () => {
    beforeEach(async () => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.useRealTimers()
    })

    test('타이머 함수가 제대로 모킹되었는지 확인', () => {
        const mockCallback = jest.fn()
        myModule.delayedAction(mockCallback)

        jest.advanceTimersByTime(1000)

        expect(mockCallback).toHaveBeenCalledWith('Real value')
    })
})

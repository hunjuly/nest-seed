import { originalFunc } from './function'

jest.mock('./function', () => ({
    originalFunc: jest.fn()
}))

test('함수가 호출되었는지 확인', () => {
    ;(originalFunc as jest.Mock).mockReturnValue(42)

    const result = originalFunc()

    expect(result).toBe(42)
    expect(originalFunc).toHaveBeenCalled()
})

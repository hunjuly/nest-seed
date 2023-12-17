import { enumsTransformer } from '..'

enum Color {
    Red = 'RED',
    Blue = 'BLUE',
    Green = 'GREEN'
}

describe('enumsTransformer', () => {
    it('배열 형태의 열거형 값을 쉼표로 구분된 문자열로 변환한다', () => {
        const transformer = enumsTransformer<Color>()
        const input: Color[] = [Color.Red, Color.Blue, Color.Green]
        const output = transformer.to(input)

        expect(output).toBe('RED,BLUE,GREEN')
    })

    it('쉼표로 구분된 문자열을 열거형 값의 배열로 변환한다', () => {
        const transformer = enumsTransformer<Color>()
        const input = 'RED,BLUE,GREEN'
        const output = transformer.from(input)

        expect(output).toEqual([Color.Red, Color.Blue, Color.Green])
    })

    it('입력 값이 null일 때 null을 반환한다', () => {
        const transformer = enumsTransformer<Color>()
        const input = null
        const output = transformer.to(input)

        expect(output).toBeNull()
    })

    it('입력 값이 null일 때 null을 반환한다', () => {
        const transformer = enumsTransformer<Color>()
        const input = null
        const output = transformer.from(input)

        expect(output).toBeNull()
    })
})

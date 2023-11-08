import { MyClass } from './class'

jest.mock('./class', () => {
    return {
        MyClass: jest.fn().mockImplementation(() => ({
            myMethod: jest.fn().mockReturnValue('Mocked value')
        }))
    }
})

test('클래스가 제대로 인스턴스화되고 메소드가 호출되었는지 확인', () => {
    const instance = new MyClass()

    expect(instance.myMethod()).toBe('Mocked value')
    expect(MyClass).toHaveBeenCalledTimes(1)
})

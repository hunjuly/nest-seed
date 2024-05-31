import * as MyModule from './function-spy'

test('여러 함수가 제대로 모킹되었는지 확인', () => {
    const mockFunc1 = jest.spyOn(MyModule, 'func1').mockReturnValue('Mocked value 1')
    const mockFunc2 = jest.spyOn(MyModule, 'func2').mockReturnValue('Mocked value 2')

    expect(MyModule.func1()).toBe('Mocked value 1')
    expect(MyModule.func2()).toBe('Mocked value 2')

    expect(mockFunc1).toHaveBeenCalled()
    expect(mockFunc2).toHaveBeenCalled()

    mockFunc1.mockRestore()
    mockFunc2.mockRestore()
})

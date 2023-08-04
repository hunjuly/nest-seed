import axios from 'axios'
import { fetchData } from './module'

jest.mock('axios')

test('axios 모듈이 제대로 호출되었는지 확인', async () => {
    ;(axios.get as jest.Mock).mockResolvedValue({ data: 'Mocked data' })

    const result = await fetchData()

    expect(result).toBe('Mocked data')
    expect(axios.get).toHaveBeenCalledWith('https://example.com')
})

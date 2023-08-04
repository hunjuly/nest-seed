import axios from 'axios'

export function func1(): string {
    return 'Real value'
}

export function func2(): string {
    return 'Real value'
}

export async function fetchData(): Promise<string> {
    const response = await axios.get('https://example.com')
    return response.data
}

export async function postData(data: any): Promise<string> {
    const response = await axios.post('https://example.com', data)
    return response.data
}

import axios from 'axios'

export async function fetchData(): Promise<string> {
    const response = await axios.get('https://example.com')
    return response.data
}

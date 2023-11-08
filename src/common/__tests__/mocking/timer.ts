export function delayedAction(callback: (value: string) => void): void {
    setTimeout(() => {
        callback('Real value')
    }, 1000)
}

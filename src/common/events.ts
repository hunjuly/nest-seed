export abstract class AppEvent {
    static eventName: string
    public name: string

    constructor() {
        this.name = ''
    }
}

export function EventName(name: string) {
    return function <T extends new (...args: any[]) => AppEvent>(constructor: T) {
        return class extends constructor {
            static eventName = name
            constructor(...args: any[]) {
                super(...args)
                this.name = name // AppEvent의 eventName 설정
            }
        }
    }
}

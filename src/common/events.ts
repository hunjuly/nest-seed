export abstract class AppEvent {
    static eventName: string
    public name: string

    constructor() {
        this.name = ''
    }
}

// export abstract class AppEvent {
//     constructor(public eventName: string) {}
// }

// export function EventName(eventName: string) {
//     return function <T extends new (...args: any[]) => AppEvent>(constructor: T) {
//         return class extends constructor {
//             static eventName = eventName
//             constructor(...args: any[]) {
//                 super(eventName, ...args)
//             }
//         }
//     }
// }

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

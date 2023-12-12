/* istanbul ignore file */

export class Exception extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'TypeormException'
    }
}

export class EntityNotFoundException extends Exception {
    constructor(message?: string) {
        super(message)
        this.name = 'EntityNotFoundException'
    }
}

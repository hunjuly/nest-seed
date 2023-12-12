/* istanbul ignore file */

export class TypeormException extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'TypeormException'
    }
}

export class EntityNotFoundException extends TypeormException {
    constructor(message?: string) {
        super(message)
        this.name = 'EntityNotFoundException'
    }
}

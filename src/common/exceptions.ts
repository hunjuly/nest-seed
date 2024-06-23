export class Exception extends Error {
    constructor(message?: string) {
        super(message)
        this.name = this.constructor.name
    }
}

/**
 * An exception that cannot or should not occur.
 * The entire system should be immediately stopped, and the cause of the problem should be investigated.
 */
export class FatalException extends Exception {}

/**
 * An exception caused by an incorrect state or behavior in the code logic.
 * This is usually caused by a programmer's mistake.
 */
export class LogicException extends FatalException {}

/**
 * Exceptions caused by invalid user input
 */
export class UserException extends Exception {}

/**
 * Exception caused by a preference issue.
 * You need to shut down the instance.
 */
export class EnvironmentException extends Exception {}

/**
 * An exception that occurs when no data matches the provided ID or the data does not match expectations.
 * This may be due to a programming error or imprecise data synchronization.
 */
export class DataErrorException extends Exception {}

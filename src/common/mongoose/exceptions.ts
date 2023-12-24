import { Exception } from 'common'

export class MongooseException extends Exception {}

export class DocumentNotFoundMongooseException extends MongooseException {}

export class ParameterMongooseException extends MongooseException {}

export class BaseError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends BaseError {
  constructor(
    message: string,
    code: string,
    public readonly originalError?: any
  ) {
    super(message, code);
  }
}

export class ResourceExistsError extends DatabaseError {
  constructor(resource: string) {
    super(
      `${resource} already exists`,
      'RESOURCE_EXISTS'
    );
  }
}

export class ResourceNotFoundError extends DatabaseError {
  constructor(resource: string) {
    super(
      `${resource} not found`,
      'RESOURCE_NOT_FOUND'
    );
  }
}

export class InvalidStateError extends DatabaseError {
  constructor(message: string) {
    super(
      message,
      'INVALID_STATE'
    );
  }
}

export function handleDatabaseError(error: any, resource?: string): never {
  console.log('error: ' + JSON.stringify(error));
  if (error.name === 'ConditionalCheckFailedException') {
    throw new ResourceExistsError(resource || 'Resource');
  }
  if (error.name === 'ResourceNotFoundException') {
    throw new ResourceNotFoundError(resource || 'Resource');
  }
  if (error instanceof BaseError) {
    throw error;
  }
  
  throw new DatabaseError(
    'An unexpected database error occurred',
    'UNKNOWN_ERROR',
    error
  );
}
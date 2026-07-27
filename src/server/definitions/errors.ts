export class DefinitionStoreError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DefinitionStoreError';
  }
}

export {
  DefinitionRevisionConflictError,
  DefinitionRevisionNotFoundError,
  DefinitionValidationError,
} from '@agnostic/core';

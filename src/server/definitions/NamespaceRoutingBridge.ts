import type {
  AgnosticBridge,
  AgnosticCapabilities,
  AgnosticQuery,
  DataItem,
} from '@agnostic/core';
import { isDefinitionNamespace } from '@agnostic/core';

export class NamespaceRoutingBridge implements AgnosticBridge {
  readonly capabilities: AgnosticCapabilities;

  constructor(
    private readonly definitionBridge: AgnosticBridge,
    private readonly recordBridge: AgnosticBridge,
  ) {
    this.capabilities = recordBridge.capabilities;
  }

  read(namespace: string, query?: AgnosticQuery): Promise<DataItem[]> {
    return this.bridgeFor(namespace).read(namespace, query);
  }

  write(
    namespace: string,
    record: Partial<DataItem> & { data: Record<string, unknown> },
  ): Promise<DataItem> {
    return this.bridgeFor(namespace).write(namespace, record);
  }

  remove(namespace: string, id: string): Promise<void> {
    return this.bridgeFor(namespace).remove(namespace, id);
  }

  renameCollection(fromNamespace: string, toNamespace: string): Promise<void> {
    const bridge = this.bridgeFor(fromNamespace);
    if (!bridge.renameCollection) {
      return Promise.reject(new Error('renameCollection is not supported by the selected bridge.'));
    }
    return bridge.renameCollection(fromNamespace, toNamespace);
  }

  renameField(namespace: string, oldKey: string, newKey: string): Promise<void> {
    const bridge = this.bridgeFor(namespace);
    if (!bridge.renameField) {
      return Promise.reject(new Error('renameField is not supported by the selected bridge.'));
    }
    return bridge.renameField(namespace, oldKey, newKey);
  }

  deleteField(namespace: string, key: string): Promise<void> {
    const bridge = this.bridgeFor(namespace);
    if (!bridge.deleteField) {
      return Promise.reject(new Error('deleteField is not supported by the selected bridge.'));
    }
    return bridge.deleteField(namespace, key);
  }

  private bridgeFor(namespace: string): AgnosticBridge {
    return isDefinitionNamespace(namespace)
      ? this.definitionBridge
      : this.recordBridge;
  }
}

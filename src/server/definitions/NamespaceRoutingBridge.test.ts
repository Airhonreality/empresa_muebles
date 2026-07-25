import type { AgnosticBridge, DataItem } from '@agnostic/core';
import { describe, expect, it, vi } from 'vitest';
import { NamespaceRoutingBridge } from './NamespaceRoutingBridge';

function bridgeDouble(storageType: 'FILE' | 'SQL'): AgnosticBridge {
  return {
    capabilities: {
      storageType,
      isRelational: storageType === 'SQL',
    },
    read: vi.fn(async () => []),
    write: vi.fn(async (namespace, record) => ({
      id: record.id ?? 'generated-id',
      context: namespace,
      data: record.data,
    } as DataItem)),
    remove: vi.fn(async () => undefined),
    renameCollection: vi.fn(async () => undefined),
    renameField: vi.fn(async () => undefined),
    deleteField: vi.fn(async () => undefined),
  };
}

describe('NamespaceRoutingBridge', () => {
  it.each([
    'schema_definitions',
    'page_routes',
    'scripts',
  ])('routes all CRUD operations for definition namespace %s to the definition bridge', async namespace => {
    const definitions = bridgeDouble('FILE');
    const records = bridgeDouble('SQL');
    const bridge = new NamespaceRoutingBridge(definitions, records);
    const record = { id: 'definition-1', data: { name: 'definition' } };

    await bridge.read(namespace, { where: { id: 'definition-1' } });
    await bridge.write(namespace, record);
    await bridge.remove(namespace, 'definition-1');

    expect(definitions.read).toHaveBeenCalledWith(namespace, {
      where: { id: 'definition-1' },
    });
    expect(definitions.write).toHaveBeenCalledWith(namespace, record);
    expect(definitions.remove).toHaveBeenCalledWith(namespace, 'definition-1');
    expect(records.read).not.toHaveBeenCalled();
    expect(records.write).not.toHaveBeenCalled();
    expect(records.remove).not.toHaveBeenCalled();
  });

  it('routes an operational namespace to the record bridge and exposes its capabilities', async () => {
    const definitions = bridgeDouble('FILE');
    const records = bridgeDouble('SQL');
    const bridge = new NamespaceRoutingBridge(definitions, records);
    const record = { id: 'record-1', data: { value: 'active' } };

    await bridge.read('operational_records');
    await bridge.write('operational_records', record);
    await bridge.remove('operational_records', 'record-1');

    expect(bridge.capabilities).toBe(records.capabilities);
    expect(records.read).toHaveBeenCalledWith('operational_records', undefined);
    expect(records.write).toHaveBeenCalledWith('operational_records', record);
    expect(records.remove).toHaveBeenCalledWith('operational_records', 'record-1');
    expect(definitions.read).not.toHaveBeenCalled();
    expect(definitions.write).not.toHaveBeenCalled();
    expect(definitions.remove).not.toHaveBeenCalled();
  });

  it('routes optional refactor operations using their source namespace', async () => {
    const definitions = bridgeDouble('FILE');
    const records = bridgeDouble('SQL');
    const bridge = new NamespaceRoutingBridge(definitions, records);

    await bridge.renameCollection('page_routes', 'archived_routes');
    await bridge.renameField('scripts', 'old_key', 'new_key');
    await bridge.deleteField('schema_definitions', 'obsolete_key');
    await bridge.renameCollection('operational_records', 'archived_records');
    await bridge.renameField('operational_records', 'old_key', 'new_key');
    await bridge.deleteField('operational_records', 'obsolete_key');

    expect(definitions.renameCollection).toHaveBeenCalledWith(
      'page_routes',
      'archived_routes',
    );
    expect(definitions.renameField).toHaveBeenCalledWith(
      'scripts',
      'old_key',
      'new_key',
    );
    expect(definitions.deleteField).toHaveBeenCalledWith(
      'schema_definitions',
      'obsolete_key',
    );
    expect(records.renameCollection).toHaveBeenCalledWith(
      'operational_records',
      'archived_records',
    );
    expect(records.renameField).toHaveBeenCalledWith(
      'operational_records',
      'old_key',
      'new_key',
    );
    expect(records.deleteField).toHaveBeenCalledWith(
      'operational_records',
      'obsolete_key',
    );
  });

  it('fails explicitly when the selected bridge lacks an optional operation', async () => {
    const definitions = bridgeDouble('FILE');
    const records = bridgeDouble('SQL');
    delete records.renameField;
    const bridge = new NamespaceRoutingBridge(definitions, records);

    await expect(
      bridge.renameField('operational_records', 'old_key', 'new_key'),
    ).rejects.toThrow('renameField is not supported by the selected bridge.');
  });
});

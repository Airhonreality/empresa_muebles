import { NextRequest, NextResponse } from 'next/server';
import vm from 'vm';
import { isDefinitionNamespace } from '@agnostic/core';
import { createPersistenceTopology } from '@/server/definitions/topology';

export async function POST(req: NextRequest) {
  try {
    const { zap, payload } = await req.json();

    if (!zap) {
      return NextResponse.json({ success: false, error: 'zap name is required' }, { status: 400 });
    }

    const topology = createPersistenceTopology();
    const revision = await topology.definitionReader.readActiveRevision();

    // 1. Fetch scripts from one coherent definition revision.
    const scripts = revision.definitions.scripts;
    const scriptRecord = scripts.find((s: any) => s.data?.name === zap || s.name === zap);

    if (!scriptRecord) {
      return NextResponse.json({ success: false, error: `Script de Lógica "${zap}" no encontrado en el sistema` }, { status: 404 });
    }

    const scriptCode = scriptRecord.data?.code || scriptRecord.code || '';

    // 2. Prepare transaction audit events list
    const events: any[] = [];

    // 3. Construct isomorphic Server-Side Execution Sandbox API
    const executionAPI = {
      notify: {
        success: (msg: string) => {
          events.push({ action: 'notify', type: 'success', message: msg });
        },
        error: (msg: string) => {
          events.push({ action: 'notify', type: 'error', message: msg });
        }
      },
      saveItem: async (ctx: string, recordPayload: any) => {
        if (isDefinitionNamespace(ctx) && topology.mode === 'revision') {
          throw new Error(`Zap writes to definition namespace "${ctx}" are not allowed in revision mode.`);
        }
        const normalized = {
          id: recordPayload.id,
          data: recordPayload.data ?? recordPayload
        };
        const result = await topology.recordStore.write(ctx, normalized);
        events.push({ action: 'materia_sync', context: ctx, item: result });
        return result;
      },
      query: async (ctx: string) => {
        const records = isDefinitionNamespace(ctx)
          ? revision.definitions[ctx]
          : await topology.recordStore.read(ctx);
        return records.map((r: any) => ({ id: r.id, ...(r.data ?? r) }));
      },
      dispatchEvent: (action: string, eventPayload: any) => {
        events.push({ action, payload: eventPayload });
      }
    };

    // 4. Execute secure isolation using vm.runInNewContext
    // Wrapping in async IIFE and awaiting the returned Promise
    const wrapper = `
      promise = (async () => {
        try {
          ${scriptCode}
        } catch (err) {
          errorCallback(err.message);
        }
      })()
    `;

    let scriptErrorMessage: string | null = null;

    const sandbox = {
      api: executionAPI,
      payload: payload || {},
      state: {},
      promise: null as any,
      console: {
        log: (...args: any[]) => console.log('[Sandbox Log]', ...args),
        error: (...args: any[]) => console.error('[Sandbox Error]', ...args),
      },
      errorCallback: (msg: string) => {
        scriptErrorMessage = msg;
      }
    };

    vm.createContext(sandbox);
    vm.runInNewContext(wrapper, sandbox, { timeout: 5000 });

    if (sandbox.promise) {
      await sandbox.promise;
    }

    if (scriptErrorMessage) {
      return NextResponse.json({ success: false, error: scriptErrorMessage, events });
    }

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error('[Engine API] Execution failed:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Execution failed'
    }, { status: 500 });
  }
}

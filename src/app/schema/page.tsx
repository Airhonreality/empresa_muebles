'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { DataItem, FieldDefinition } from '@/core/types';
import styles from './schema.module.css';

type Tab = 'config' | 'schemas' | 'routes';

export default function SchemaBuilderPage() {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const { state } = useAppContext();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'config', label: 'System Config' },
    { id: 'schemas', label: 'Schema Definitions' },
    { id: 'routes', label: 'Page Routes' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Schema Builder</h1>
        <nav className={styles.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.content}>
        {state.system.isLoading ? (
          <div className={styles.loading}>Connecting to data silo&hellip;</div>
        ) : (
          <>
            {activeTab === 'config' && <SystemConfigPanel />}
            {activeTab === 'schemas' && <SchemaDefinitionsPanel />}
            {activeTab === 'routes' && <PageRoutesPanel />}
          </>
        )}
      </main>
    </div>
  );
}

// ── System Config ──────────────────────────────────────────────────────────────
function SystemConfigPanel() {
  const { state, saveItem } = useAppContext();
  const configItems = state.data['system_config'] ?? [];
  const existingId = configItems[0]?.id ?? 'system_config_main';

  const [form, setForm] = useState<Record<string, string>>({
    site_title: '',
    home_slug: '',
    identity_color: '#0070f3',
    theme_mode: 'light',
    ...state.system.config,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveItem('system_config', {
      id: existingId,
      context: 'system_config',
      data: form,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (key: string, label: string, node: React.ReactNode) => (
    <div key={key} className={styles.field}>
      <label className={styles.label}>{label}</label>
      {node}
    </div>
  );

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>System Configuration</h2>
      <div className={styles.form}>
        {field(
          'site_title',
          'Site Title',
          <input
            className={styles.input}
            value={form.site_title ?? ''}
            onChange={e => setForm(f => ({ ...f, site_title: e.target.value }))}
            placeholder="My Application"
          />
        )}
        {field(
          'home_slug',
          'Home Slug',
          <input
            className={styles.input}
            value={form.home_slug ?? ''}
            onChange={e => setForm(f => ({ ...f, home_slug: e.target.value }))}
            placeholder="dashboard (without leading /)"
          />
        )}
        {field(
          'theme_mode',
          'Theme Mode',
          <select
            className={styles.input}
            value={form.theme_mode ?? 'light'}
            onChange={e => setForm(f => ({ ...f, theme_mode: e.target.value }))}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="warm">Warm</option>
          </select>
        )}
        {field(
          'identity_color',
          'Identity Color',
          <div className={styles.colorRow}>
            <input
              type="color"
              className={styles.colorPicker}
              value={form.identity_color ?? '#0070f3'}
              onChange={e => setForm(f => ({ ...f, identity_color: e.target.value }))}
            />
            <input
              className={styles.input}
              value={form.identity_color ?? ''}
              onChange={e => setForm(f => ({ ...f, identity_color: e.target.value }))}
              placeholder="#0070f3"
            />
          </div>
        )}
        <button className={styles.btnPrimary} onClick={handleSave}>
          {saved ? 'Saved ✓' : 'Save Config'}
        </button>
      </div>
    </section>
  );
}

// ── Schema Definitions ─────────────────────────────────────────────────────────
function SchemaDefinitionsPanel() {
  const { state, saveItem, deleteItem } = useAppContext();
  const schemas = state.data['schema_definitions'] ?? [];
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFields, setEditFields] = useState<FieldDefinition[]>([]);

  const openNew = () => {
    setEditId(`schema_${Date.now()}`);
    setEditName('');
    setEditFields([]);
  };

  const openEdit = (item: DataItem) => {
    setEditId(item.id);
    setEditName(item.data.name as string);
    setEditFields((item.data.fields as FieldDefinition[]) ?? []);
  };

  const cancel = () => setEditId(null);

  const handleSave = async () => {
    if (!editId) return;
    await saveItem('schema_definitions', {
      id: editId,
      context: 'schema_definitions',
      data: { name: editName, fields: editFields },
    });
    setEditId(null);
  };

  const addField = () =>
    setEditFields(f => [...f, { key: '', label: '', type: 'text' }]);

  const updateField = (i: number, patch: Partial<FieldDefinition>) =>
    setEditFields(f => f.map((fld, idx) => (idx === i ? { ...fld, ...patch } : fld)));

  const removeField = (i: number) =>
    setEditFields(f => f.filter((_, idx) => idx !== i));

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Schema Definitions</h2>
        <button className={styles.btnPrimary} onClick={openNew}>+ New Schema</button>
      </div>

      {editId && (
        <div className={styles.editor}>
          <div className={styles.field}>
            <label className={styles.label}>Schema Name</label>
            <input
              className={styles.input}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Product, Client, Order…"
            />
          </div>

          <div className={styles.fieldsBlock}>
            <div className={styles.fieldsHeader}>
              <span className={styles.fieldsTitle}>Fields</span>
              <button className={styles.btnSecondary} onClick={addField}>+ Add Field</button>
            </div>
            {editFields.length === 0 && (
              <p className={styles.hint}>No fields yet. Add at least one.</p>
            )}
            {editFields.map((f, i) => (
              <div key={i} className={styles.fieldRow}>
                <input
                  className={styles.inputSm}
                  value={f.key}
                  onChange={e => updateField(i, { key: e.target.value })}
                  placeholder="key"
                />
                <input
                  className={styles.inputSm}
                  value={f.label}
                  onChange={e => updateField(i, { label: e.target.value })}
                  placeholder="Label"
                />
                <select
                  className={styles.inputSm}
                  value={f.type}
                  onChange={e => updateField(i, { type: e.target.value as FieldDefinition['type'] })}
                >
                  {(['text', 'number', 'select', 'textarea', 'image', 'boolean'] as const).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={f.required ?? false}
                    onChange={e => updateField(i, { required: e.target.checked })}
                  />
                  req
                </label>
                {f.type === 'select' && (
                  <input
                    className={styles.inputSm}
                    value={(f.options ?? []).join(', ')}
                    onChange={e =>
                      updateField(i, {
                        options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="opt1, opt2"
                  />
                )}
                <button className={styles.btnDanger} onClick={() => removeField(i)}>✕</button>
              </div>
            ))}
          </div>

          <div className={styles.editorActions}>
            <button className={styles.btnPrimary} onClick={handleSave}>Save Schema</button>
            <button className={styles.btnSecondary} onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {schemas.length === 0 && !editId && (
          <div className={styles.empty}>No schemas defined. Create your first one.</div>
        )}
        {schemas.map(item => (
          <div key={item.id} className={styles.listItem}>
            <div className={styles.listInfo}>
              <strong>{item.data.name as string}</strong>
              <span className={styles.badge}>
                {((item.data.fields as FieldDefinition[]) ?? []).length} fields
              </span>
            </div>
            <div className={styles.listActions}>
              <button className={styles.btnSecondary} onClick={() => openEdit(item)}>Edit</button>
              <button
                className={styles.btnDanger}
                onClick={() => { if (confirm('Delete schema?')) deleteItem('schema_definitions', item.id); }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page Routes ────────────────────────────────────────────────────────────────
function PageRoutesPanel() {
  const { state, saveItem, deleteItem } = useAppContext();
  const routes = state.data['page_routes'] ?? [];
  const [editId, setEditId] = useState<string | null>(null);
  const [editPath, setEditPath] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [contentType, setContentType] = useState<'blocks' | 'module'>('blocks');
  const [editModule, setEditModule] = useState('');
  const [editBlocks, setEditBlocks] = useState('[]');
  const [blocksError, setBlocksError] = useState('');

  const openNew = () => {
    setEditId(`route_${Date.now()}`);
    setEditPath('/');
    setEditTitle('');
    setContentType('blocks');
    setEditModule('');
    setEditBlocks('[]');
    setBlocksError('');
  };

  const openEdit = (item: DataItem) => {
    const d = item.data as Record<string, unknown>;
    setEditId(item.id);
    setEditPath(d.path as string ?? '/');
    setEditTitle(d.title as string ?? '');
    setContentType(d.module ? 'module' : 'blocks');
    setEditModule(d.module as string ?? '');
    setEditBlocks(JSON.stringify(d.blocks ?? [], null, 2));
    setBlocksError('');
  };

  const cancel = () => setEditId(null);

  const handleSave = async () => {
    if (!editId) return;
    const data: Record<string, unknown> = { path: editPath, title: editTitle };
    if (contentType === 'module') {
      data.module = editModule;
    } else {
      try {
        data.blocks = JSON.parse(editBlocks);
        setBlocksError('');
      } catch {
        setBlocksError('Invalid JSON in blocks');
        return;
      }
    }
    await saveItem('page_routes', { id: editId, context: 'page_routes', data });
    setEditId(null);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Page Routes</h2>
        <button className={styles.btnPrimary} onClick={openNew}>+ New Route</button>
      </div>

      {editId && (
        <div className={styles.editor}>
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Path</label>
              <input
                className={styles.input}
                value={editPath}
                onChange={e => setEditPath(e.target.value)}
                placeholder="/my-page"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Title</label>
              <input
                className={styles.input}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Page Title"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Content Type</label>
              <select
                className={styles.input}
                value={contentType}
                onChange={e => setContentType(e.target.value as 'blocks' | 'module')}
              >
                <option value="blocks">Block Composition</option>
                <option value="module">Dynamic Module (.js)</option>
              </select>
            </div>
            {contentType === 'module' ? (
              <div className={styles.field}>
                <label className={styles.label}>Module File</label>
                <input
                  className={styles.input}
                  value={editModule}
                  onChange={e => setEditModule(e.target.value)}
                  placeholder="MyModule.js (in data-silo/modules/)"
                />
              </div>
            ) : (
              <div className={styles.field}>
                <label className={styles.label}>
                  Blocks (JSON)
                  <span className={styles.hint}> — types: heading, text, image, grid, data-table</span>
                </label>
                <textarea
                  className={`${styles.textarea} ${blocksError ? styles.inputError : ''}`}
                  rows={10}
                  value={editBlocks}
                  onChange={e => { setEditBlocks(e.target.value); setBlocksError(''); }}
                  spellCheck={false}
                />
                {blocksError && <span className={styles.errorMsg}>{blocksError}</span>}
                <details className={styles.blockHelp}>
                  <summary>Block schema reference</summary>
                  <pre className={styles.pre}>{BLOCK_EXAMPLE}</pre>
                </details>
              </div>
            )}
          </div>
          <div className={styles.editorActions}>
            <button className={styles.btnPrimary} onClick={handleSave}>Save Route</button>
            <button className={styles.btnSecondary} onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {routes.length === 0 && !editId && (
          <div className={styles.empty}>No routes configured. Create your first page.</div>
        )}
        {routes.map(item => {
          const d = item.data as Record<string, unknown>;
          return (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.listInfo}>
                <code className={styles.path}>{d.path as string}</code>
                <span>{d.title as string}</span>
                {typeof d.module === 'string' && d.module && (
                  <span className={styles.badge}>module: {d.module}</span>
                )}
              </div>
              <div className={styles.listActions}>
                <button className={styles.btnSecondary} onClick={() => openEdit(item)}>Edit</button>
                <button
                  className={styles.btnDanger}
                  onClick={() => { if (confirm('Delete route?')) deleteItem('page_routes', item.id); }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const BLOCK_EXAMPLE = `[
  { "type": "heading", "level": 1, "content": "Page Title" },
  { "type": "text", "content": "Paragraph text here." },
  { "type": "image", "src": "/api/assets/photo.jpg", "content": "Alt text" },
  { "type": "grid", "context": "Products" },
  { "type": "data-table", "context": "Orders" }
]`;

'use client';

import { useParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { DynamicModuleHost } from '@/components/DynamicModuleHost';
import { Database, Plus, Table as TableIcon, Layout as LayoutIcon, Settings } from 'lucide-react';
import type { IndraSchema } from '@agnostic/core';
import styles from '../explorer.module.css';

export default async function EntityPage({ params }: { params: Promise<{ entityKey: string }> }) {
  const { entityKey } = await params;
  const { state } = useAppContext();

  // Find the schema for this entity
  const schema = state.system.schemas.find(s => s.id === entityKey || s.name.toLowerCase() === entityKey.toLowerCase());

  if (!schema) {
    return (
      <div className={styles.errorState}>
        <Database size={48} className={styles.errorIcon} />
        <h2>Entity "{entityKey}" not found</h2>
        <p>Ensure the schema exists in the Schema Builder.</p>
      </div>
    );
  }

  // const schema = schemaItem.data as unknown as IndraSchema;
  
  // Logic Switch: Custom vs Automatic
  // If the schema definition includes a 'custom_logic' field, we use the Dynamic Host
  // For now, we check if there is a 'custom_logic' property in the schema data
  const customLogic = (schema as any).custom_logic;

  return (
    <div className={styles.pageContent}>
      <header className={styles.contentHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>
            <LayoutIcon size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>{schema.name}</h1>
            <p className={styles.pageSubtitle}>Entity Repository / {entityKey}</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary}>
            <Plus size={16} />
            <span>New {schema.name}</span>
          </button>
        </div>
      </header>

      <section className={styles.viewSection}>
        {customLogic ? (
          <div className={styles.customViewWrapper}>
            <div className={styles.customViewBadge}>
              <Settings size={12} />
              <span>Custom Logic Active: {customLogic}</span>
            </div>
            <DynamicModuleHost moduleName={customLogic} />
          </div>
        ) : (
          <div className={styles.automaticView}>
            <div className={styles.viewHeader}>
              <div className={styles.viewTab}>
                <TableIcon size={14} />
                <span>Default Data Grid</span>
              </div>
            </div>
            <div className={styles.gridPlaceholder}>
              <p>Automatic form and grid generator for <strong>{schema.name}</strong> items will be rendered here.</p>
              <pre className={styles.debug}>
                {JSON.stringify(schema.fields, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

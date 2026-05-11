'use client';

import { useAppContext } from '@/context/AppContext';
import { useTranslation } from '@/core/i18n/useTranslation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Layout, Package, Users, FileText, ChevronRight } from 'lucide-react';
import styles from './explorer.module.css';

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { state } = useAppContext();
  const pathname = usePathname();

  // Get all defined schemas
  const schemas = state.system.schemas;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Package size={18} />
          <h2 className={styles.sidebarTitle}>{t('explorer.title')}</h2>
        </div>

        <nav className={styles.nav}>
          {schemas.length === 0 && (
            <div className={styles.emptyNav}>
              {t('explorer.empty')}
            </div>
          )}
          {schemas.map(schema => {
            const key = schema.id;
            const name = schema.name;
            const isActive = pathname.includes(`/explorer/${key}`);

            return (
              <Link 
                key={schema.id} 
                href={`/explorer/${key}`}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <div className={styles.linkIcon}>
                  <Database size={14} />
                </div>
                <span className={styles.linkLabel}>{name}</span>
                {isActive && <ChevronRight size={14} className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/schema" className={styles.adminLink}>
            Go to Schema Builder
          </Link>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

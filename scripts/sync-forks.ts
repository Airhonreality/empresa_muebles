/**
 * 🔄 AGNOSTIC ENGINE SYNC UTILITY (sync-forks.ts)
 * ===============================================
 * 
 * ROLE: Propagates engine updates, generic admin APIs, and designer UI components
 *       from the seed repository to local sibling forks without overwriting
 *       custom business domains or localized storage databases.
 * 
 * USAGE:
 * npx tsx scripts/sync-forks.ts [optional-target-path]
 */

import fs from 'fs';
import path from 'path';

// Clean copy utility
function copyRecursive(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // Ensure parent directory exists
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

// Merge package.json dependencies and scripts without losing custom metadata
function mergePackageJson(srcPkgPath: string, destPkgPath: string) {
  if (!fs.existsSync(destPkgPath)) return;
  try {
    const srcPkg = JSON.parse(fs.readFileSync(srcPkgPath, 'utf8'));
    const destPkg = JSON.parse(fs.readFileSync(destPkgPath, 'utf8'));

    // Merge dependencies
    destPkg.dependencies = {
      ...destPkg.dependencies,
      ...srcPkg.dependencies
    };

    // Merge devDependencies
    destPkg.devDependencies = {
      ...destPkg.devDependencies,
      ...srcPkg.devDependencies
    };

    // Merge scripts
    destPkg.scripts = {
      ...destPkg.scripts,
      ...srcPkg.scripts
    };

    fs.writeFileSync(destPkgPath, JSON.stringify(destPkg, null, 2) + '\n', 'utf8');
    console.log(`  ✅ package.json dependencies and scripts merged.`);
  } catch (err: any) {
    console.error(`  ❌ Error merging package.json: ${err.message}`);
  }
}

async function main() {
  const argTarget = process.argv[2];
  const currentDir = process.cwd();
  
  // Paths in seed repository to propagate
  const PATHS_TO_SYNC = [
    'packages',
    'src/components/agnostic',
    'src/app/api/admin',
    'scripts',
  ];

  let targetForks: string[] = [];

  if (argTarget) {
    const targetPath = path.resolve(currentDir, argTarget);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetForks.push(targetPath);
    } else {
      console.error(`❌ Error: El directorio destino especificado no existe: ${argTarget}`);
      process.exit(1);
    }
  } else {
    // Auto-detect sibling forks
    const parentDir = path.dirname(currentDir);
    try {
      const siblings = fs.readdirSync(parentDir, { withFileTypes: true });
      for (const sibling of siblings) {
        if (sibling.isDirectory() && sibling.name !== path.basename(currentDir)) {
          const siblingPath = path.join(parentDir, sibling.name);
          const pkgPath = path.join(siblingPath, 'package.json');
          if (fs.existsSync(pkgPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
              // Detect if it is an agnostic system fork (contains agnostic packages or specific scripts/configs)
              const isAgnosticFork = 
                pkg.name === 'agnostic-system-seed' ||
                fs.existsSync(path.join(siblingPath, 'packages/core')) ||
                fs.existsSync(path.join(siblingPath, 'src/components/agnostic'));
              
              if (isAgnosticFork) {
                targetForks.push(siblingPath);
              }
            } catch { /* skip invalid JSONs */ }
          }
        }
      }
    } catch (err: any) {
      console.error(`❌ Error al escanear directorios hermanos: ${err.message}`);
      process.exit(1);
    }
  }

  if (targetForks.length === 0) {
    console.log('⚠️ No se detectaron forks hermanos elegibles para la sincronización.');
    return;
  }

  console.log(`\n🔄 Sincronizador del Motor Agnóstico iniciado.`);
  console.log(`📦 Repositorio origen: [${path.basename(currentDir)}]`);
  console.log(`🎯 Destinos detectados (${targetForks.length}):`);
  targetForks.forEach(f => console.log(`   - ${path.basename(f)} (${f})`));
  console.log('\n------------------------------------------------');

  for (const forkPath of targetForks) {
    const forkName = path.basename(forkPath);
    console.log(`\n🚀 Sincronizando fork: [${forkName}]...`);

    // 1. Sync directories and files
    for (const relativePath of PATHS_TO_SYNC) {
      const srcPath = path.join(currentDir, relativePath);
      const destPath = path.join(forkPath, relativePath);

      if (fs.existsSync(srcPath)) {
        // Prevent copying script itself recursively into script target if inside scripts/
        if (relativePath === 'scripts') {
          const files = fs.readdirSync(srcPath);
          for (const file of files) {
            if (file !== 'sync-forks.ts') {
              copyRecursive(path.join(srcPath, file), path.join(destPath, file));
            }
          }
        } else {
          copyRecursive(srcPath, destPath);
        }
        console.log(`  ✅ Sincronizado: ${relativePath}`);
      }
    }

    // 2. Merge package.json dependencies and scripts safely
    const srcPkg = path.join(currentDir, 'package.json');
    const destPkg = path.join(forkPath, 'package.json');
    mergePackageJson(srcPkg, destPkg);

    // 3. Copy package-lock.json to match the dependency locks
    const srcLock = path.join(currentDir, 'package-lock.json');
    const destLock = path.join(forkPath, 'package-lock.json');
    if (fs.existsSync(srcLock)) {
      fs.copyFileSync(srcLock, destLock);
      console.log(`  ✅ package-lock.json sincronizado.`);
    }
  }

  console.log('\n✨ Sincronización de forks completada con éxito.\n');
}

main().catch(err => {
  console.error('❌ Error crítico durante la sincronización:', err);
  process.exit(1);
});

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const wsPath = process.argv[2];
if (!wsPath) {
  console.error('Se requiere la ruta del workspace');
  process.exit(1);
}

const targetPackageJsonPath = path.join(wsPath, 'package.json');

try {
  // Check if package.json has conflicts
  const status = execSync('git status --porcelain package.json', { cwd: wsPath, encoding: 'utf-8' });
  if (!status.includes('UU package.json')) {
    console.log('No hay conflictos en package.json o no existe.');
    process.exit(0);
  }

  console.log('Resolviendo conflictos en package.json de forma inteligente...');

  // Read the fork's state before the merge (HEAD)
  const localRaw = execSync('git show :2:package.json', { cwd: wsPath, encoding: 'utf-8' });
  // Read the incoming engine state (MERGE_HEAD)
  const incomingRaw = execSync('git show :3:package.json', { cwd: wsPath, encoding: 'utf-8' });

  const localPkg = JSON.parse(localRaw);
  const incomingPkg = JSON.parse(incomingRaw);

  // Start with the incoming (engine) package.json as the base
  const resolvedPkg = { ...incomingPkg };

  // Restore custom dependencies from the fork that are not in the engine
  const preserveDeps = (depsKey) => {
    if (localPkg[depsKey]) {
      resolvedPkg[depsKey] = resolvedPkg[depsKey] || {};
      for (const [dep, version] of Object.entries(localPkg[depsKey])) {
        if (!incomingPkg[depsKey] || !incomingPkg[depsKey][dep]) {
          resolvedPkg[depsKey][dep] = version;
          console.log(`[+] Restaurada dependencia personalizada: ${dep}@${version}`);
        }
      }
    }
  };

  preserveDeps('dependencies');
  preserveDeps('devDependencies');

  // Write the resolved file back to the workspace
  fs.writeFileSync(targetPackageJsonPath, JSON.stringify(resolvedPkg, null, 2) + '\n', 'utf-8');

  // Stage the resolved file
  execSync('git add package.json', { cwd: wsPath });
  
  // Try to update lockfile
  if (fs.existsSync(path.join(wsPath, 'package-lock.json'))) {
     console.log('Regenerando package-lock.json sin conflictos...');
     execSync('npm install', { cwd: wsPath, stdio: 'ignore' });
     execSync('git add package-lock.json', { cwd: wsPath });
  }

  console.log('package.json resuelto exitosamente.');

} catch (err) {
  console.error('Error resolviendo package.json:', err.message);
  process.exit(1);
}

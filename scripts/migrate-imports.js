const fs = require('fs');
const path = require('path');

const FILES_TO_UPDATE = [
  'src/server/strategies/SupabaseStrategy.ts',
  'src/server/strategies/LocalStrategy.ts',
  'src/server/strategies/GitHubStrategy.ts',
  'src/server/getStrategy.ts',
  'src/core/server/vault.ts',
  'src/context/AuthContext.tsx',
  'src/context/AppContext.tsx',
  'src/components/PageComposer.tsx',
  'src/components/DynamicModuleHost.tsx',
  'src/components/agnostic/primitives/AgnosticInput.tsx',
  'src/app/explorer/[entityKey]/page.tsx',
  'src/app/schema/components/SystemConfigPanel.tsx',
  'src/app/api/vault/route.ts',
  'src/app/schema/components/SchemaDefinitionsPanel.tsx',
  'src/app/schema/components/PageRoutesPanel.tsx',
  'src/components/agnostic/blocks/AgnosticCollection.tsx',
  'src/components/agnostic/engine/AgnosticRenderer.tsx'
];

FILES_TO_UPDATE.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/@\/core\/indra/g, '@agnostic/core');
    content = content.replace(/@\/core\/bridge/g, '@agnostic/core');
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated imports in ${relPath}`);
  } else {
    console.warn(`⚠️ File not found: ${relPath}`);
  }
});

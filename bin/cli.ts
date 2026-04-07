// src/cli.ts
import { Project } from 'ts-morph';
import path from 'path';
import { readFileSync } from 'fs';
import { transformSourceFile } from './transformer';

console.log('🚀 Spouštím AOT kompilaci projektu...\n');

const tsConfigFilePath = path.join(process.cwd(), 'tsconfig.json');
const project = new Project({
  tsConfigFilePath,
  skipAddingFilesFromTsConfig: false,
});

const sourceFiles = project.getSourceFiles();
console.log(`📁 Nalezeno ${sourceFiles.length} souborů ke kontrole.`);

// --- PŘIDÁNO: STRIKTNÍ TYPOVÁ KONTROLA PŘED KOMPILACÍ ---
console.log('🔍 Provádím Type-checking projektu...');
const preEmitDiagnostics = project.getPreEmitDiagnostics();

if (preEmitDiagnostics.length > 0) {
  console.error('\n❌ Kompilace zastavena! Nalezeny chyby TypeScriptu:');
  // Toto vypíše chyby úplně stejně hezky barevně jako nativní 'tsc'
  console.log(project.formatDiagnosticsWithColorAndContext(preEmitDiagnostics));
  process.exit(1); // Ukončí proces s chybou (nepustí build dál)
}
console.log('✅ Typy jsou v pořádku. Spouštím AOT transformace...\n');

let transformedFilesCount = 0;

sourceFiles.forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  const rawText = readFileSync(filePath, 'utf-8');

  // Textový filtr - extrémně urychlí průchod velkým projektem
  if (!rawText.includes('lib.compile')) {
    return;
  }

  // Zavoláme oddělenou transformační logiku
  const wasTransformed = transformSourceFile(sourceFile);

  if (wasTransformed) {
    transformedFilesCount++;
    console.log(`✅ Ztransformováno: ${sourceFile.getBaseName()}`);
  }
});

console.log(`\n⚙️ Transformace dokončeny (${transformedFilesCount} souborů upraveno). Kompiluji do JavaScriptu...`);

const emitResult = project.emitSync();

console.log('🎉 Build úspěšně dokončen!');

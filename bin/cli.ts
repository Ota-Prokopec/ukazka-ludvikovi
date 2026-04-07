import { Project } from 'ts-morph';
import path from 'path';
import { readFileSync } from 'fs';
import { extractFromSourceFile } from './transformer';

console.log('🚀 Spouštím AOT generování TypeScript schémat...\n');

const tsConfigFilePath = path.join(process.cwd(), 'tsconfig.json');
const project = new Project({
  tsConfigFilePath,
  skipAddingFilesFromTsConfig: false,
});

const sourceFiles = project.addSourceFilesAtPaths('src/schemas/!(index).ts');
console.log(`📁 Nalezeno ${sourceFiles.length} souborů ke kontrole.`);

let transformedFilesCount = 0;
let globalUsesEmailValidation = false;
let finalIndexContent = '';

sourceFiles.forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  const rawText = readFileSync(filePath, 'utf-8');

  // Zkontrolujeme, zda má smysl do souboru vůbec koukat (zda obsahuje lib.)
  if (!rawText.includes('lib.')) {
    return;
  }

  const result = extractFromSourceFile(sourceFile);

  // Pokud jsme našli jakékoliv typy nebo kompilovaná schémata
  if (result.schemas.length > 0 || result.types.length > 0) {
    transformedFilesCount++;
    if (result.usesEmailValidation) globalUsesEmailValidation = true;

    // Nejdříve do indexu nasypeme ZÁKLADNÍ TYPY (např. ContactDefType)
    result.types.forEach((t) => {
      finalIndexContent += `export type ${t.typeName} = ${t.typeDef};\n\n`;
    });

    // A následně KOMPILOVANÁ SCHÉMATA (např. ContactSchemaType a contactSchema)
    result.schemas.forEach((schema) => {
      finalIndexContent += `export type ${schema.typeName} = ${schema.typeDef};\n\n`;
      finalIndexContent += `export const ${schema.varName} = ${schema.validationCode};\n\n`;
    });

    console.log(`✅ Zpracováno do paměti z: ${sourceFile.getBaseName()}`);
  }
});

// --- VYTVOŘENÍ A EXPORT INDEXU ---
console.log(`\n⚙️ Vytvářím výsledný src/schemas/index.ts...`);

const importStr = globalUsesEmailValidation
  ? `import { emailValidation } from "../helpers/emailValidation.js";\n\n`
  : '';

const indexFile = project.createSourceFile('src/schemas/index.ts', importStr + finalIndexContent, { overwrite: true });
indexFile.formatText();
indexFile.saveSync();

console.log(
  `🎉 Build úspěšně dokončen! Zpracováno ${transformedFilesCount} souborů a výsledek zapsán do src/schemas/index.ts.`,
);

// src/transformer.ts
import { SourceFile, SyntaxKind, CallExpression, Node } from 'ts-morph';
import { generateValidationCode, GenerationContext } from './generator';

export function transformSourceFile(sourceFile: SourceFile): boolean {
  let hasTransformations = false;

  // Inicializujeme kontext pro tento konkrétní soubor
  const ctx: GenerationContext = {
    loopId: 0,
    usesEmailValidation: false,
  };

  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  callExpressions.forEach((callExpr: CallExpression) => {
    if (callExpr.wasForgotten()) return;

    if (callExpr.getExpression().getText() === 'lib.compile') {
      const rootSchemaNode = callExpr.getArguments()[0];
      if (!rootSchemaNode) return;

      // Generování hlavní validace
      const mainConditions = generateValidationCode(rootSchemaNode, 'data', 'root', ctx);
      let fieldsCode = '';

      // Extrakce .standalone() vlastností
      if (Node.isCallExpression(rootSchemaNode) && rootSchemaNode.getExpression().getText() === 'lib.object') {
        const objLiteral = rootSchemaNode.getArguments()[0];
        if (Node.isObjectLiteralExpression(objLiteral)) {
          objLiteral.getProperties().forEach((prop) => {
            if (Node.isPropertyAssignment(prop)) {
              const key = prop.getName();
              const initializer = prop.getInitializer()!;

              if (initializer.getText().includes('.standalone()')) {
                // Generujeme kód izolovaně jen pro tuto vlastnost
                const standaloneValidation = generateValidationCode(initializer, 'data', key, ctx).trim();
                fieldsCode += `\n    ${key}: {\n      parse: (data: any) => {\n    ${standaloneValidation}\n        return data;\n      }\n    },`;
              }
            }
          });
        }
      }

      // Sestavení a nahrazení AST uzlu
      const generatedCode = `{
  parse: (data: any) => {
${mainConditions}    return data;
  }${fieldsCode !== '' ? `,\n  fields: {${fieldsCode}\n  }` : ''}
}`;

      callExpr.replaceWithText(generatedCode);
      hasTransformations = true;
    }
  });

  // Přidání importů, pokud to kontext vyžaduje
  if (hasTransformations && ctx.usesEmailValidation) {
    const existingImport = sourceFile.getImportDeclaration(
      (decl) => decl.getModuleSpecifierValue() === './helpers/emailValidation.js',
    );
    if (!existingImport) {
      sourceFile.insertStatements(0, `import { emailValidation } from "./helpers/emailValidation.js";`);
    }
  }

  return hasTransformations;
}

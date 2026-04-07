import { SourceFile, SyntaxKind, Node, VariableDeclaration } from 'ts-morph';
import {
  generateValidationCode,
  generateTypeScriptType,
  extractStandaloneFields,
  GenerationContext,
} from './generator';

export interface ExtractedType {
  typeName: string;
  typeDef: string;
}

export interface ExtractedSchema {
  varName: string;
  typeName: string;
  typeDef: string;
  validationCode: string;
}

export interface TransformResult {
  schemas: ExtractedSchema[];
  types: ExtractedType[];
  usesEmailValidation: boolean;
}

export function extractFromSourceFile(sourceFile: SourceFile): TransformResult {
  const result: TransformResult = { schemas: [], types: [], usesEmailValidation: false };
  const ctx: GenerationContext = { loopId: 0, usesEmailValidation: false };

  const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);

  varDecls.forEach((varDecl: VariableDeclaration) => {
    const initializer = varDecl.getInitializer();
    if (!initializer) return;

    if (Node.isCallExpression(initializer)) {
      const expressionText = initializer.getExpression().getText();

      if (expressionText.startsWith('lib.')) {
        const varName = varDecl.getName();
        const typeName = varName.charAt(0).toUpperCase() + varName.slice(1) + 'Type';

        if (expressionText === 'lib.compile') {
          const rootSchemaNode = initializer.getArguments()[0];
          if (!rootSchemaNode) return;

          const typeString = generateTypeScriptType(rootSchemaNode);

          // ZMĚNA: Předáváme 'varName' (např. mySchema) místo 'root'
          const mainConditions: string = generateValidationCode(rootSchemaNode, 'data', varName, ctx);
          const fieldsCode = extractStandaloneFields(rootSchemaNode, varName, ctx);

          const generatedCode = `{
    parse: (data: any) => {
      ${mainConditions}    return data;
  }${fieldsCode !== '' ? `,\n  fields: {${fieldsCode}\n  }` : ''}
}`;

          result.schemas.push({
            varName,
            typeName,
            typeDef: typeString,
            validationCode: generatedCode,
          });
        } else {
          const typeString = generateTypeScriptType(initializer);
          result.types.push({
            typeName,
            typeDef: typeString,
          });
        }
      }
    }
  });

  result.usesEmailValidation = ctx.usesEmailValidation;
  return result;
}

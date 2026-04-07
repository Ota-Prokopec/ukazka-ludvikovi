// src/generator.ts
import { Node } from 'ts-morph';

// Kontext, který si rekurze předává mezi sebou
export interface GenerationContext {
  loopId: number;
  usesEmailValidation: boolean;
}

export function generateValidationCode(node: Node, varPath: string, errorPath: string, ctx: GenerationContext): string {
  const text = node.getText();

  // 1. ZÁKLADNÍ TYPY
  if (text.startsWith('lib.string'))
    return `    if (typeof ${varPath} !== "string") throw new Error(\`${errorPath} musí být string\`);\n`;
  if (text.startsWith('lib.number'))
    return `    if (typeof ${varPath} !== "number") throw new Error(\`${errorPath} musí být číslo\`);\n`;
  if (text.startsWith('lib.boolean'))
    return `    if (typeof ${varPath} !== "boolean") throw new Error(\`${errorPath} musí být boolean\`);\n`;

  // --- NOVÉ: FILE API ---
  const fileMatch = text.match(/lib\.file\(([^)]*)\)/);
  if (text.startsWith('lib.file')) {
    const errorMsg = fileMatch && fileMatch[1]?.trim() ? fileMatch[1].trim() : `\`${errorPath} musí být objekt File\``;
    // Do produkce vložíme bleskovou instanceof kontrolu s pojistkou
    return `    if (typeof File === "undefined" || !(${varPath} instanceof File)) throw new Error(${errorMsg});\n`;
  }

  // 2. EMAIL
  if (text.startsWith('lib.email')) {
    ctx.usesEmailValidation = true;
    const emailMatch = text.match(/lib\.email\(([^)]*)\)/);
    const errorMsg =
      emailMatch && emailMatch[1]?.trim() ? emailMatch[1].trim() : `\`${errorPath} musí být platný email\``;
    return `    if (!emailValidation(${varPath})) throw new Error(${errorMsg});\n`;
  }

  // 3. SLOŽITĚJŠÍ STRUKTURY (Objekty a Pole)
  if (Node.isCallExpression(node)) {
    const exprName = node.getExpression().getText();

    if (exprName === 'lib.object') {
      let code = `    if (typeof ${varPath} !== "object" || ${varPath} === null) throw new Error(\`${errorPath} musí být objekt\`);\n`;
      const objLiteral = node.getArguments()[0];

      if (Node.isObjectLiteralExpression(objLiteral)) {
        objLiteral.getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const nextVarPath = `${varPath}.${key}`;
            const nextErrPath = errorPath === 'root' ? key : `${errorPath}.${key}`;
            code += generateValidationCode(prop.getInitializer()!, nextVarPath, nextErrPath, ctx);
          }
        });
      }
      return code;
    }

    if (exprName === 'lib.array') {
      const innerTypeNode = node.getArguments()[0];
      const i = `i${ctx.loopId++}`; // Použijeme ID z kontextu a hned ho o 1 zvětšíme
      const itemVar = `item_${i}`;

      let code = `    if (!Array.isArray(${varPath})) throw new Error(\`${errorPath} musí být pole\`);\n`;
      code += `    for (let ${i} = 0; ${i} < ${varPath}.length; ${i}++) {\n`;
      code += `      const ${itemVar} = ${varPath}[${i}];\n`;

      const nextErrPath = errorPath === 'root' ? `root[\${${i}}]` : `${errorPath}[\${${i}}]`;
      code += generateValidationCode(innerTypeNode, itemVar, nextErrPath, ctx);
      code += `    }\n`;
      return code;
    }
  }
  return '';
}

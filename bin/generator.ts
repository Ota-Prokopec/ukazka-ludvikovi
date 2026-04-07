// src/generator.ts
import { Node } from 'ts-morph';

export interface GenerationContext {
  loopId: number;
  usesEmailValidation: boolean;
}

export function generateValidationCode(node: Node, varPath: string, errorPath: string, ctx: GenerationContext): string {
  // 1. DETEKCE A PŘEKLAD PROMĚNNÝCH (VČETNĚ IMPORTŮ)
  if (Node.isIdentifier(node)) {
    let symbol = node.getSymbol();
    if (symbol && symbol.isAlias()) {
      symbol = symbol.getAliasedSymbol();
    }
    const declaration = symbol?.getDeclarations()[0];

    // Handle variable declarations
    if (declaration && Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer();
      if (initializer) {
        return generateValidationCode(initializer, varPath, errorPath, ctx);
      }
    }

    // Handle imported symbols - follow to source definition
    if (declaration && Node.isImportSpecifier(declaration)) {
      const sourceSymbol = declaration.getSymbol();
      if (sourceSymbol) {
        const sourceDeclaration = sourceSymbol.getDeclarations()[0];
        if (sourceDeclaration && Node.isVariableDeclaration(sourceDeclaration)) {
          const initializer = sourceDeclaration.getInitializer();
          if (initializer) {
            return generateValidationCode(initializer, varPath, errorPath, ctx);
          }
        }
      }
    }

    return '';
  }

  // Získání čistého textu bez mezer pro spolehlivější startWith
  const text = node.getText().trim();

  // 2. ZÁKLADNÍ TYPY (Checky pomocí startsWith)
  if (text.startsWith('lib.string')) {
    let code = `    if (typeof ${varPath} !== "string") throw new Error(\`${errorPath} musí být string\`);\n`;
    if (Node.isCallExpression(node)) {
      const args = node.getArguments();
      if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
        const objLiteral = args[0];
        const regexProp = objLiteral.getProperty('regex');
        const msgProp = objLiteral.getProperty('message');
        if (regexProp && Node.isPropertyAssignment(regexProp)) {
          const regexText = regexProp.getInitializer()?.getText();
          const msgText =
            msgProp && Node.isPropertyAssignment(msgProp)
              ? msgProp.getInitializer()?.getText()
              : `\`${errorPath} neodpovídá požadovanému formátu\``;
          if (regexText) code += `    if (!(${regexText}).test(${varPath})) throw new Error(${msgText});\n`;
        }
      }
    }
    return code;
  }

  if (text.startsWith('lib.number'))
    return `    if (typeof ${varPath} !== "number") throw new Error(\`${errorPath} musí být číslo\`);\n`;

  if (text.startsWith('lib.boolean'))
    return `    if (typeof ${varPath} !== "boolean") throw new Error(\`${errorPath} musí být boolean\`);\n`;

  if (text.startsWith('lib.email')) {
    ctx.usesEmailValidation = true;
    const emailMatch = text.match(/lib\.email\(([^)]*)\)/);
    const errorMsg =
      emailMatch && emailMatch[1]?.trim() ? emailMatch[1].trim() : `\`${errorPath} musí být platný email\``;
    return `    if (!emailValidation(${varPath})) throw new Error(${errorMsg});\n`;
  }

  // 3. SLOŽITĚJŠÍ STRUKTURY A METODY (CallExpressions)
  // 3. SLOŽITĚJŠÍ STRUKTURY (Metody, Objekty a Pole)
  // 3. SLOŽITĚJŠÍ STRUKTURY (Metody, Objekty a Pole)
  if (Node.isCallExpression(node)) {
    const expression = node.getExpression();

    // --- A. DETEKCE METODY .extend() ---
    // Kontrolujeme, zda se volá metoda ".extend" na nějakém objektu
    if (Node.isPropertyAccessExpression(expression) && expression.getName() === 'extend') {
      const baseObjectNode = expression.getExpression(); // To je to "contactDef"
      const extendArgs = node.getArguments();

      let code = '';

      // 1. Rekurze: Vygenerujeme kód pro základ (ten se najde i v jiném souboru)
      const baseCode = generateValidationCode(baseObjectNode, varPath, errorPath, ctx);
      code += baseCode;

      // 2. Přidáme kód pro nové vlastnosti z vnitřku .extend({ ... })
      if (extendArgs.length > 0 && Node.isObjectLiteralExpression(extendArgs[0])) {
        extendArgs[0].getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const nextVarPath = `${varPath}.${key}`;
            const nextErrPath = errorPath === 'root' ? key : `${errorPath}.${key}`;
            const initializer = prop.getInitializer();

            if (initializer) {
              // Tady generujeme kód pro ty nově přidané vlastnosti
              code += generateValidationCode(initializer, nextVarPath, nextErrPath, ctx);
            }
          }
        });
      }

      return code; // Vrátíme spojený kód (základ + rozšíření)
    }

    // --- B. ZÁKLADNÍ VOLÁNÍ (lib.object, lib.array) ---
    // Použijeme raději .getName() pokud je to PropertyAccess, je to stabilnější než .getText()
    const name = Node.isPropertyAccessExpression(expression) ? expression.getName() : expression.getText();

    if (name === 'object') {
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

    if (name === 'array') {
      const innerTypeNode = node.getArguments()[0];
      const i = `i${ctx.loopId++}`;
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

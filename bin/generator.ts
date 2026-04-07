import { Node } from 'ts-morph';

export interface GenerationContext {
  loopId: number;
  usesEmailValidation: boolean;
}

export function generateTypeScriptType(node: Node): string {
  if (Node.isIdentifier(node)) {
    const name = node.getText();
    return name.charAt(0).toUpperCase() + name.slice(1) + 'Type';
  }

  const text = node.getText().trim();

  if (text.startsWith('lib.string') || text.startsWith('lib.email')) return 'string';
  if (text.startsWith('lib.number')) return 'number';
  if (text.startsWith('lib.boolean')) return 'boolean';

  // V generateTypeScriptType(node: Node) přidejte:
  if (text.startsWith('lib.literal')) {
    const arg = (node as any).getArguments()[0];
    const type = arg.getType();

    // 1. Pokud je to pole přímo v kódu: lib.literal([1, 2])
    if (Node.isArrayLiteralExpression(arg)) {
      return arg
        .getElements()
        .map((el) => el.getText())
        .join(' | ');
    }

    // 2. Pokud je to Union typ odjinud (např. importované Enum/Union)
    if (type.isUnion()) {
      return type
        .getUnionTypes()
        .map((t) => t.getText())
        .join(' | ');
    }

    // 3. Klasický jeden literál
    return type.getText();
  }

  if (Node.isCallExpression(node)) {
    const expression = node.getExpression();
    const name = Node.isPropertyAccessExpression(expression) ? expression.getName() : expression.getText();

    if (name === 'extend') {
      const baseObj = expression.getExpression();
      const baseType = generateTypeScriptType(baseObj);
      const extendArgs = node.getArguments();

      let extendType = '{}';
      if (extendArgs.length > 0 && Node.isObjectLiteralExpression(extendArgs[0])) {
        let props = '';
        extendArgs[0].getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const valType = generateTypeScriptType(prop.getInitializer()!);
            props += `  ${key}: ${valType};\n`;
          }
        });
        extendType = `{\n${props}}`;
      }
      return `${baseType} & ${extendType}`;
    }

    if (name === 'object' || name === 'lib.object') {
      const objLiteral = node.getArguments()[0];
      if (Node.isObjectLiteralExpression(objLiteral)) {
        let props = '';
        objLiteral.getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const valType = generateTypeScriptType(prop.getInitializer()!);
            props += `  ${key}: ${valType};\n`;
          }
        });
        return `{\n${props}}`;
      }
      return '{}';
    }

    if (name === 'array') {
      const innerTypeNode = node.getArguments()[0];
      const innerType = generateTypeScriptType(innerTypeNode);
      return `Array<${innerType}>`;
    }
  }

  return 'any';
}

/**
 * Nově předáváme 'errorPath' z vnějšku (např. 'mySchema'), abychom získali přesnou cestu k chybě.
 */
export function extractStandaloneFields(node: Node, errorPath: string, ctx: GenerationContext): string {
  let fieldsCode = '';

  if (Node.isIdentifier(node)) {
    let symbol = node.getSymbol();
    if (symbol && symbol.isAlias()) symbol = symbol.getAliasedSymbol();
    const declaration = symbol?.getDeclarations()[0];

    if (declaration && Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer();
      if (initializer) return extractStandaloneFields(initializer, errorPath, ctx);
    }

    if (declaration && Node.isImportSpecifier(declaration)) {
      const sourceSymbol = declaration.getSymbol();
      if (sourceSymbol) {
        const sourceDeclaration = sourceSymbol.getDeclarations()[0];
        if (sourceDeclaration && Node.isVariableDeclaration(sourceDeclaration)) {
          const initializer = sourceDeclaration.getInitializer();
          if (initializer) return extractStandaloneFields(initializer, errorPath, ctx);
        }
      }
    }
    return '';
  }

  if (Node.isCallExpression(node)) {
    const expression = node.getExpression();
    const name = Node.isPropertyAccessExpression(expression) ? expression.getName() : expression.getText();

    if (name === 'extend') {
      const baseNode = expression.getExpression();
      fieldsCode += extractStandaloneFields(baseNode, errorPath, ctx);

      const extendArgs = node.getArguments();
      if (extendArgs.length > 0 && Node.isObjectLiteralExpression(extendArgs[0])) {
        extendArgs[0].getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const propInit = prop.getInitializer()!;
            if (propInit.getText().includes('.standalone()')) {
              const nextErrPath = `${errorPath}.${key}`;
              const standaloneValidation = generateValidationCode(propInit, 'data', nextErrPath, ctx).trim();
              fieldsCode += `\n    ${key}: {\n      parse: (data: any) => {\n    ${standaloneValidation}\n        return data;\n      }\n    },`;
            }
          }
        });
      }
      return fieldsCode;
    }

    if (name === 'object' || name === 'lib.object') {
      const objArgs = node.getArguments();
      if (objArgs.length > 0 && Node.isObjectLiteralExpression(objArgs[0])) {
        objArgs[0].getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const propInit = prop.getInitializer()!;
            if (propInit.getText().includes('.standalone()')) {
              const nextErrPath = `${errorPath}.${key}`;
              const standaloneValidation = generateValidationCode(propInit, 'data', nextErrPath, ctx).trim();
              fieldsCode += `\n    ${key}: {\n      parse: (data: any) => {\n    ${standaloneValidation}\n        return data;\n      }\n    },`;
            }
          }
        });
      }
      return fieldsCode;
    }
  }

  return fieldsCode;
}

export function generateValidationCode(node: Node, varPath: string, errorPath: string, ctx: GenerationContext): string {
  if (Node.isIdentifier(node)) {
    let symbol = node.getSymbol();
    if (symbol && symbol.isAlias()) {
      symbol = symbol.getAliasedSymbol();
    }
    const declaration = symbol?.getDeclarations()[0];

    if (declaration && Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer();
      if (initializer) return generateValidationCode(initializer, varPath, errorPath, ctx);
    }

    if (declaration && Node.isImportSpecifier(declaration)) {
      const sourceSymbol = declaration.getSymbol();
      if (sourceSymbol) {
        const sourceDeclaration = sourceSymbol.getDeclarations()[0];
        if (sourceDeclaration && Node.isVariableDeclaration(sourceDeclaration)) {
          const initializer = sourceDeclaration.getInitializer();
          if (initializer) return generateValidationCode(initializer, varPath, errorPath, ctx);
        }
      }
    }
    return '';
  }

  const text = node.getText().trim();

  // Změna formátu chyby z Error() na objekt { path, message }
  if (text.startsWith('lib.string')) {
    let code = `    if (typeof ${varPath} !== "string") throw { path: \`${errorPath}\`, message: "Musí být string" };\n`;
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
              : `"Neodpovídá požadovanému formátu"`;
          if (regexText)
            code += `    if (!(${regexText}).test(${varPath})) throw { path: \`${errorPath}\`, message: ${msgText} };\n`;
        }
      }
    }
    return code;
  }

  if (text.startsWith('lib.number'))
    return `    if (typeof ${varPath} !== "number") throw { path: \`${errorPath}\`, message: "Musí být číslo" };\n`;

  if (text.startsWith('lib.boolean'))
    return `    if (typeof ${varPath} !== "boolean") throw { path: \`${errorPath}\`, message: "Musí být boolean" };\n`;

  if (text.startsWith('lib.email')) {
    ctx.usesEmailValidation = true;
    const emailMatch = text.match(/lib\.email\(([^)]*)\)/);
    const errorMsg = emailMatch && emailMatch[1]?.trim() ? emailMatch[1].trim() : `"Musí být platný email"`;
    return `    if (!emailValidation(${varPath})) throw { path: \`${errorPath}\`, message: ${errorMsg} };\n`;
  }

  // V generateValidationCode(node: Node, varPath: string, errorPath: string, ctx: GenerationContext)

  if (text.startsWith('lib.literal')) {
    const arg = (node as any).getArguments()[0];
    const type = arg.getType();

    let valuesText: string;

    if (Node.isArrayLiteralExpression(arg)) {
      // Případ lib.literal([1, 2])
      valuesText = arg.getText(); // Vrátí přímo "[1, 2]"
    } else if (type.isUnion()) {
      // Případ importované proměnné, která je union
      valuesText = `[${type
        .getUnionTypes()
        .map((t) => t.getText())
        .join(', ')}]`;
    } else {
      // Klasický jeden literál
      const val = type.getText();
      return `    if (${varPath} !== ${val}) throw { path: \`${errorPath}\`, message: \`Musí být přesně \${${val}}\` };\n`;
    }

    return `    if (!${valuesText}.includes(${varPath})) throw { path: \`${errorPath}\`, message: \`Musí být jedna z hodnot: \${${valuesText}.join(', ')}\` };\n`;
  }

  if (Node.isCallExpression(node)) {
    const expression = node.getExpression();

    if (Node.isPropertyAccessExpression(expression) && expression.getName() === 'extend') {
      const baseObjectNode = expression.getExpression();
      const extendArgs = node.getArguments();
      let code = generateValidationCode(baseObjectNode, varPath, errorPath, ctx);

      if (extendArgs.length > 0 && Node.isObjectLiteralExpression(extendArgs[0])) {
        extendArgs[0].getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const nextVarPath = `${varPath}.${key}`;
            const nextErrPath = `${errorPath}.${key}`;
            const initializer = prop.getInitializer();
            if (initializer) {
              code += generateValidationCode(initializer, nextVarPath, nextErrPath, ctx);
            }
          }
        });
      }
      return code;
    }

    const name = Node.isPropertyAccessExpression(expression) ? expression.getName() : expression.getText();

    if (name === 'object' || name === 'lib.object') {
      let code = `    if (typeof ${varPath} !== "object" || ${varPath} === null) throw { path: \`${errorPath}\`, message: "Musí být objekt" };\n`;
      const objLiteral = node.getArguments()[0];

      if (Node.isObjectLiteralExpression(objLiteral)) {
        objLiteral.getProperties().forEach((prop) => {
          if (Node.isPropertyAssignment(prop)) {
            const key = prop.getName();
            const nextVarPath = `${varPath}.${key}`;
            const nextErrPath = `${errorPath}.${key}`;
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

      let code = `    if (!Array.isArray(${varPath})) throw { path: \`${errorPath}\`, message: "Musí být pole" };\n`;
      code += `    for (let ${i} = 0; ${i} < ${varPath}.length; ${i}++) {\n`;
      code += `      const ${itemVar} = ${varPath}[${i}];\n`;

      // Cesta pro pole bude např. mySchema.users[0]
      const nextErrPath = `${errorPath}[\${${i}}]`;
      code += generateValidationCode(innerTypeNode, itemVar, nextErrPath, ctx);
      code += `    }\n`;
      return code;
    }
  }

  return '';
}

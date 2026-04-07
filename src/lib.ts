// src/lib.ts
import { emailValidation } from './helpers/emailValidation.js';

// ==========================================
// 1. ZÁKLADNÍ ROZHRANÍ A TYPY
// ==========================================

export type Infer<T extends { parse: any }> = ReturnType<T['parse']>;

export interface Field<T, S extends boolean = false> {
  _type: T; // Falešná (phantom) property pro TypeScript inferenci
  _standalone: S; // Značka pro TypeScript, zda je pole standalone
  isStandalone: boolean; // Skutečná (runtime) property pro Dev mód

  standalone(): Field<T, true>;
  parse(data: unknown): T;
}

// Magický typ, který složí výsledný objekt po volání lib.compile()
export type CompiledSchema<T> = {
  // Hlavní validace vrací kompletní odvozený typ
  parse: (data: unknown) => T extends Field<infer U, any> ? U : never;
} &
  // Objekt "fields" se vygeneruje POUZE pokud je kořenem validace objekt
  (T extends ObjectField<infer Shape, any>
    ? {
        fields: {
          // Vyfiltrujeme jen ty klíče ze Shape, které mají _standalone: true
          [K in keyof Shape as Shape[K]['_standalone'] extends true ? K : never]: {
            parse: (data: unknown) => Shape[K]['_type'];
          };
        };
      }
    : {}); // Pokud kořen není objekt (např. pole), fields neexistuje

// ==========================================
// 2. IMPLEMENTACE TŘÍD (PRO DEV MÓD)
// ==========================================

class CoreField<T, S extends boolean = false> implements Field<T, S> {
  declare _type: T;
  declare _standalone: S;
  public isStandalone = false;

  constructor(protected parserFn: (data: unknown) => T) {}

  standalone(): CoreField<T, true> {
    this.isStandalone = true;
    return this as unknown as CoreField<T, true>;
  }

  parse(data: unknown): T {
    return this.parserFn(data);
  }
}

// Speciální třída pro objekty (abychom mohli iterovat přes vlastnosti)
export class ObjectField<Shape extends Record<string, Field<any, any>>, S extends boolean = false> extends CoreField<
  { [K in keyof Shape]: Shape[K]['_type'] },
  S
> {
  constructor(public shape: Shape) {
    super((data: unknown) => {
      if (typeof data !== 'object' || data === null) throw new Error('Expected object');
      const result: any = {};
      for (const key in shape) {
        result[key] = shape[key]?.parse((data as any)[key]);
      }
      return result;
    });
  }

  standalone(): ObjectField<Shape, true> {
    this.isStandalone = true;
    return this as unknown as ObjectField<Shape, true>;
  }
}

// Speciální třída pro pole
export class ArrayField<Inner extends Field<any, any>, S extends boolean = false> extends CoreField<
  Array<Inner['_type']>,
  S
> {
  constructor(public inner: Inner) {
    super((data: unknown) => {
      if (!Array.isArray(data)) throw new Error('Expected array');
      const result: any[] = [];
      for (let i = 0; i < data.length; i++) {
        result.push(inner.parse(data[i]));
      }
      return result;
    });
  }

  standalone(): ArrayField<Inner, true> {
    this.isStandalone = true;
    return this as unknown as ArrayField<Inner, true>;
  }
}

// ==========================================
// 3. VEŘEJNÉ API (TO, CO IMPORTUJE VÝVOJÁŘ)
// ==========================================

export const lib = {
  string: () =>
    new CoreField<string>((data) => {
      if (typeof data !== 'string') throw new Error(data + 'Must be string');
      return data;
    }),

  number: () =>
    new CoreField<number>((data) => {
      if (typeof data !== 'number') throw new Error('Must be number');
      return data;
    }),

  boolean: () =>
    new CoreField<boolean>((data) => {
      if (typeof data !== 'boolean') throw new Error('Must be boolean');
      return data;
    }),

  email: (msg: string = 'Invalid email') =>
    new CoreField<string>((data) => {
      if (!emailValidation(data)) throw new Error(data + msg);
      return data as string;
    }),

  file: (msg: string = 'Must be a file') =>
    new CoreField<File>((data) => {
      // Bezpečná kontrola pro běh v Node.js
      if (typeof File === 'undefined') {
        throw new Error('File API is not supported in this environment.');
      }
      if (!(data instanceof File)) {
        throw new Error(msg);
      }
      return data;
    }),

  object: <T extends Record<string, Field<any, any>>>(shape: T) => new ObjectField(shape),

  array: <T extends Field<any, any>>(inner: T) => new ArrayField(inner),

  // Kompilační funkce – simuluje chování AOT kompilátoru v Dev módu
  compile: <T extends Field<any, any>>(rootField: T): CompiledSchema<T> => {
    const compiledSchema: any = {
      parse: (data: unknown) => rootField.parse(data),
    };

    // Pokud je kořenem validace objekt, poskládáme "fields" pro ty s .standalone()
    if (rootField instanceof ObjectField) {
      const fields: any = {};
      for (const key in rootField.shape) {
        if (rootField.shape[key].isStandalone) {
          fields[key] = {
            parse: (data: unknown) => rootField.shape[key].parse(data),
          };
        }
      }
      // Přidáme fields jen tehdy, pokud nějakéstandalone existují
      if (Object.keys(fields).length > 0) {
        compiledSchema.fields = fields;
      }
    }

    return compiledSchema as CompiledSchema<T>;
  },
};

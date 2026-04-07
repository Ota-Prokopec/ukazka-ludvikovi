// src/lib.ts
import { emailValidation } from './helpers/emailValidation.js';
// ==========================================
// 2. IMPLEMENTACE TŘÍD (PRO DEV MÓD)
// ==========================================
class CoreField {
    parserFn;
    isStandalone = false;
    constructor(parserFn) {
        this.parserFn = parserFn;
    }
    standalone() {
        this.isStandalone = true;
        return this;
    }
    parse(data) {
        return this.parserFn(data);
    }
}
// Speciální třída pro objekty (abychom mohli iterovat přes vlastnosti)
export class ObjectField extends CoreField {
    shape;
    constructor(shape) {
        super((data) => {
            if (typeof data !== 'object' || data === null)
                throw new Error('Expected object');
            const result = {};
            for (const key in shape) {
                result[key] = shape[key]?.parse(data[key]);
            }
            return result;
        });
        this.shape = shape;
    }
    standalone() {
        this.isStandalone = true;
        return this;
    }
}
// Speciální třída pro pole
export class ArrayField extends CoreField {
    inner;
    constructor(inner) {
        super((data) => {
            if (!Array.isArray(data))
                throw new Error('Expected array');
            const result = [];
            for (let i = 0; i < data.length; i++) {
                result.push(inner.parse(data[i]));
            }
            return result;
        });
        this.inner = inner;
    }
    standalone() {
        this.isStandalone = true;
        return this;
    }
}
// ==========================================
// 3. VEŘEJNÉ API (TO, CO IMPORTUJE VÝVOJÁŘ)
// ==========================================
export const lib = {
    string: () => new CoreField((data) => {
        if (typeof data !== 'string')
            throw new Error(data + 'Must be string');
        return data;
    }),
    number: () => new CoreField((data) => {
        if (typeof data !== 'number')
            throw new Error('Must be number');
        return data;
    }),
    boolean: () => new CoreField((data) => {
        if (typeof data !== 'boolean')
            throw new Error('Must be boolean');
        return data;
    }),
    email: (msg = 'Invalid email') => new CoreField((data) => {
        if (!emailValidation(data))
            throw new Error(data + msg);
        return data;
    }),
    file: (msg = 'Must be a file') => new CoreField((data) => {
        // Bezpečná kontrola pro běh v Node.js
        if (typeof File === 'undefined') {
            throw new Error('File API is not supported in this environment.');
        }
        if (!(data instanceof File)) {
            throw new Error(msg);
        }
        return data;
    }),
    object: (shape) => new ObjectField(shape),
    array: (inner) => new ArrayField(inner),
    // Kompilační funkce – simuluje chování AOT kompilátoru v Dev módu
    compile: (rootField) => {
        const compiledSchema = {
            parse: (data) => rootField.parse(data),
        };
        // Pokud je kořenem validace objekt, poskládáme "fields" pro ty s .standalone()
        if (rootField instanceof ObjectField) {
            const fields = {};
            for (const key in rootField.shape) {
                if (rootField.shape[key].isStandalone) {
                    fields[key] = {
                        parse: (data) => rootField.shape[key].parse(data),
                    };
                }
            }
            // Přidáme fields jen tehdy, pokud nějakéstandalone existují
            if (Object.keys(fields).length > 0) {
                compiledSchema.fields = fields;
            }
        }
        return compiledSchema;
    },
};
//# sourceMappingURL=lib.js.map
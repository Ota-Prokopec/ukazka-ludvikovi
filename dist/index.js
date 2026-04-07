import { emailValidation } from "./helpers/emailValidation.js";
import { lib } from './lib.js';
const schema = {
    parse: (data) => {
        if (typeof data !== "object" || data === null)
            throw new Error(`root musí být objekt`);
        if (typeof data.id !== "string")
            throw new Error(`id musí být string`);
        if (!emailValidation(data.email))
            throw new Error('Zadej platný mail');
        if (!Array.isArray(data.tags))
            throw new Error(`tags musí být pole`);
        for (let i0 = 0; i0 < data.tags.length; i0++) {
            const item_i0 = data.tags[i0];
            if (typeof item_i0 !== "object" || item_i0 === null)
                throw new Error(`tags[${i0}] musí být objekt`);
            if (!Array.isArray(item_i0.tags))
                throw new Error(`tags[${i0}].tags musí být pole`);
            for (let i1 = 0; i1 < item_i0.tags.length; i1++) {
                const item_i1 = item_i0.tags[i1];
                if (typeof item_i1 !== "object" || item_i1 === null)
                    throw new Error(`tags[${i0}].tags[${i1}] musí být objekt`);
                if (typeof item_i1.tag !== "string")
                    throw new Error(`tags[${i0}].tags[${i1}].tag musí být string`);
            }
        }
        if (typeof File === "undefined" || !(data.profilePicture instanceof File))
            throw new Error(`
      Nahraný dokument musí
       být validní soubor!
       
       `);
        return data;
    },
    fields: {
        email: {
            parse: (data) => {
                if (!emailValidation(data))
                    throw new Error('Zadej platný mail');
                return data;
            }
        },
    }
};
const neznamaData = {
    id: 'a',
    email: 'test@test.com',
    tags: [{ tags: [{ tag: 'my tag' }] }],
    profilePicture: new File([], ''),
};
// ✅ 1. Zkontroluje a vrátí PŘESNÝ typ se všemi properties!
const data = schema.parse(neznamaData);
// data.id (string)
// data.email (string)
// data.tags (string[])
console.dir(data, { depth: null });
//# sourceMappingURL=index.js.map
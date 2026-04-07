import { emailValidation } from "./helpers/emailValidation.js";
import { contactDef } from './a.js';
import { lib } from './lib.js';
// (Volitelné) Pokud potřebuješ validovat kontakty i samostatně,
// vytvoříš si pro ně zkompilovaný validátor bokem:
const contactSchema = {
    parse: (data) => {
        if (typeof data !== "object" || data === null)
            throw new Error(`root musí být objekt`);
        if (!emailValidation(data.email))
            throw new Error(`email musí být platný email`);
        if (typeof data.isActive !== "boolean")
            throw new Error(`isActive musí být boolean`);
        if (typeof data.a !== "number")
            throw new Error(`a musí být číslo`);
        return data;
    }
};
const contactSchema2 = {
    parse: (data) => {
        if (typeof data !== "object" || data === null)
            throw new Error(`root musí být objekt`);
        if (!emailValidation(data.email))
            throw new Error(`email musí být platný email`);
        if (typeof data.isActive !== "boolean")
            throw new Error(`isActive musí být boolean`);
        return data;
    }
};
// 2. Tuto surovou strukturu použiješ jako stavební kámen jinde
const keyDef = lib.object({
    id: lib.number(),
    username: lib.string(),
    contact: contactDef, // Vkládáme definici (plán), nikoliv zkompilované schéma!
});
// 3. A nakonec zkompiluješ to velké, hlavní schéma
const mySchema = {
    parse: (data) => {
        if (typeof data !== "object" || data === null)
            throw new Error(`root musí být objekt`);
        if (typeof data.key !== "object" || data.key === null)
            throw new Error(`key musí být objekt`);
        if (typeof data.key.id !== "number")
            throw new Error(`key.id musí být číslo`);
        if (typeof data.key.username !== "string")
            throw new Error(`key.username musí být string`);
        if (typeof data.key.contact !== "object" || data.key.contact === null)
            throw new Error(`key.contact musí být objekt`);
        if (!emailValidation(data.key.contact.email))
            throw new Error(`key.contact.email musí být platný email`);
        if (typeof data.key.contact.isActive !== "boolean")
            throw new Error(`key.contact.isActive musí být boolean`);
        return data;
    }
};
console.log(mySchema.parse({ key: { id: 1, username: 'fda', contact: { email: 'a@a.a', isActive: true } } }));
//# sourceMappingURL=index.js.map
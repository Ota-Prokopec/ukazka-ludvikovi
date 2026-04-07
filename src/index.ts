import { contactDef } from './a.js';
import { lib } from './lib.js';

// (Volitelné) Pokud potřebuješ validovat kontakty i samostatně,
// vytvoříš si pro ně zkompilovaný validátor bokem:

const contactSchema = lib.compile(contactDef.extend({ a: lib.number() }));
const contactSchema2 = lib.compile(contactDef);

// 2. Tuto surovou strukturu použiješ jako stavební kámen jinde
const keyDef = lib.object({
  id: lib.number(),
  username: lib.string(),
  contact: contactDef, // Vkládáme definici (plán), nikoliv zkompilované schéma!
});

// 3. A nakonec zkompiluješ to velké, hlavní schéma
const mySchema = lib.compile(
  lib.object({
    key: keyDef,
  }),
);

console.log(mySchema.parse({ key: { id: 1, username: 'fda', contact: { email: 'a@a.a', isActive: true } } }));

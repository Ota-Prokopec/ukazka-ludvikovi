import { emailValidation } from "./helpers/emailValidation.js";
import { z } from 'zod';
import { lib } from './lib.js';
// Vygenerujeme těžká data (např. 1000 uživatelů)
const payload = Array.from({ length: 1000 }).map((_, i) => ({
    id: i,
    username: `user_${i}`,
    contact: {
        email: `test${i}@test.com`,
        isActive: true,
    },
}));
// Zod schéma
const zodSchema = z.array(z.object({
    id: z.number(),
    username: z.string(),
    contact: z.object({
        email: z.string().email(),
        isActive: z.boolean(),
    }),
}));
const mySchema = {
    parse: (data) => {
        if (!Array.isArray(data))
            throw new Error(`root musí být pole`);
        for (let i0 = 0; i0 < data.length; i0++) {
            const item_i0 = data[i0];
            if (typeof item_i0 !== "object" || item_i0 === null)
                throw new Error(`root[${i0}] musí být objekt`);
            if (typeof item_i0.id !== "number")
                throw new Error(`root[${i0}].id musí být číslo`);
            if (typeof item_i0.username !== "string")
                throw new Error(`root[${i0}].username musí být string`);
            if (typeof item_i0.contact !== "object" || item_i0.contact === null)
                throw new Error(`root[${i0}].contact musí být objekt`);
            if (!emailValidation(item_i0.contact.email))
                throw new Error(`root[${i0}].contact.email musí být platný email`);
            if (typeof item_i0.contact.isActive !== "boolean")
                throw new Error(`root[${i0}].contact.isActive musí být boolean`);
        }
        return data;
    }
};
console.log('Zahřívám V8 engine...');
for (let i = 0; i < 1000; i++) {
    zodSchema.parse(payload);
    mySchema.parse(payload);
}
console.log('\nSpouštím měření (10 000 iterací nad velkým polem)...');
// MĚŘENÍ ZOD
const startZod = performance.now();
for (let i = 0; i < 10000; i++) {
    zodSchema.parse(payload);
}
const endZod = performance.now();
console.log(`Zod: ${(endZod - startZod).toFixed(2)} ms`);
// MĚŘENÍ TVÉ AOT KNIHOVNY
const startMoje = performance.now();
for (let i = 0; i < 10000; i++) {
    mySchema.parse(payload); // Tady se volá tvůj vygenerovaný, plochý kód
}
const endMoje = performance.now();
console.log(`Moje AOT: ${(endMoje - startMoje).toFixed(2)} ms`);
//# sourceMappingURL=benchmark.js.map
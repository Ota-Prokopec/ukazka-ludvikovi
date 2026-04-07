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
const zodSchema = z.array(
  z.object({
    id: z.number(),
    username: z.string(),
    contact: z.object({
      email: z.string().email(),
      isActive: z.boolean(),
    }),
  }),
);

const mySchema = lib.compile(
  lib.array(
    lib.object({
      id: lib.number(),
      username: lib.string(),
      contact: lib.object({
        email: lib.email(),
        isActive: lib.boolean(),
      }),
    }),
  ),
);

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

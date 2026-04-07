import { lib } from '../lib.js';

// 1. Zadefinuješ si "surovou" strukturu (bez lib.compile!)
export const contactDef = lib.object({
  email: lib.email(),
  isActive: lib.boolean(),
});

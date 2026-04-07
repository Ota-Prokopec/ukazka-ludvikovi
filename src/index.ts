import { lib, type Infer } from './lib.js';

const schema = lib.compile(
  lib.object({
    id: lib.string(), // Není standalone
    email: lib.email('Zadej platný mail').standalone(), // JE standalone
    tags: lib.array(lib.object({ tags: lib.array(lib.object({ tag: lib.string() })) })), // Zanořené pole
    profilePicture: lib.file(`
      Nahraný dokument musí
       být validní soubor!
       
       `),
  }),
);
type Data = Infer<typeof schema>;

type Email = Infer<typeof schema.fields.email>;

const neznamaData: Data = {
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

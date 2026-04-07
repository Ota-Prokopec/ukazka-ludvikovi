import { emailValidation } from "../helpers/emailValidation.js";

export type ContactDefType = {
    email: string;
    isActive: boolean;
};

export type SchType = {
    key: Array<Array<Array<{
        arr: Array<{
            key: {
                key1: {
                    mykey: string;
                    youkey: number;
                };
            };
        }>;
    }>>>;
};

export type KeyDefType = {
    id: number;
    username: string;
    contact: ContactDefType;
};

export type ContactSchemaType = ContactDefType & {
    a: number;
};

export const contactSchema = {
    parse: (data: any) => {
        if (typeof data !== "object" || data === null) throw { path: `contactSchema`, message: "Musí být objekt" };
        if (!emailValidation(data.email)) throw { path: `contactSchema.email`, message: "Musí být platný email" };
        if (typeof data.isActive !== "boolean") throw { path: `contactSchema.isActive`, message: "Musí být boolean" };
        if (typeof data.a !== "number") throw { path: `contactSchema.a`, message: "Musí být číslo" };
        return data;
    },
    fields: {
        a: {
            parse: (data: any) => {
                if (typeof data !== "number") throw { path: `contactSchema.a`, message: "Musí být číslo" };
                return data;
            }
        },
    }
};

export type ContactSchema2Type = ContactDefType;

export const contactSchema2 = {
    parse: (data: any) => {
        if (typeof data !== "object" || data === null) throw { path: `contactSchema2`, message: "Musí být objekt" };
        if (!emailValidation(data.email)) throw { path: `contactSchema2.email`, message: "Musí být platný email" };
        if (typeof data.isActive !== "boolean") throw { path: `contactSchema2.isActive`, message: "Musí být boolean" };
        return data;
    }
};

export type MySchemaType = {
    key: KeyDefType;
    j: SchType;
};

export const mySchema = {
    parse: (data: any) => {
        if (typeof data !== "object" || data === null) throw { path: `mySchema`, message: "Musí být objekt" };
        if (typeof data.key !== "object" || data.key === null) throw { path: `mySchema.key`, message: "Musí být objekt" };
        if (typeof data.key.id !== "number") throw { path: `mySchema.key.id`, message: "Musí být číslo" };
        if (typeof data.key.username !== "string") throw { path: `mySchema.key.username`, message: "Musí být string" };
        if (typeof data.key.contact !== "object" || data.key.contact === null) throw { path: `mySchema.key.contact`, message: "Musí být objekt" };
        if (!emailValidation(data.key.contact.email)) throw { path: `mySchema.key.contact.email`, message: "Musí být platný email" };
        if (typeof data.key.contact.isActive !== "boolean") throw { path: `mySchema.key.contact.isActive`, message: "Musí být boolean" };
        if (typeof data.j !== "object" || data.j === null) throw { path: `mySchema.j`, message: "Musí být objekt" };
        if (!Array.isArray(data.j.key)) throw { path: `mySchema.j.key`, message: "Musí být pole" };
        for (let i0 = 0; i0 < data.j.key.length; i0++) {
            const item_i0 = data.j.key[i0];
            if (!Array.isArray(item_i0)) throw { path: `mySchema.j.key[${i0}]`, message: "Musí být pole" };
            for (let i1 = 0; i1 < item_i0.length; i1++) {
                const item_i1 = item_i0[i1];
                if (!Array.isArray(item_i1)) throw { path: `mySchema.j.key[${i0}][${i1}]`, message: "Musí být pole" };
                for (let i2 = 0; i2 < item_i1.length; i2++) {
                    const item_i2 = item_i1[i2];
                    if (typeof item_i2 !== "object" || item_i2 === null) throw { path: `mySchema.j.key[${i0}][${i1}][${i2}]`, message: "Musí být objekt" };
                    if (!Array.isArray(item_i2.arr)) throw { path: `mySchema.j.key[${i0}][${i1}][${i2}].arr`, message: "Musí být pole" };
                    for (let i3 = 0; i3 < item_i2.arr.length; i3++) {
                        const item_i3 = item_i2.arr[i3];
                        if (typeof item_i3 !== "object" || item_i3 === null) throw { path: `mySchema.j.key[${i0}][${i1}][${i2}].arr[${i3}]`, message: "Musí být objekt" };
                        if (typeof item_i3.key !== "object" || item_i3.key === null) throw { path: `mySchema.j.key[${i0}][${i1}][${i2}].arr[${i3}].key`, message: "Musí být objekt" };
                        if (typeof item_i3.key.key1 !== "object" || item_i3.key.key1 === null) throw { path: `mySchema.j.key[${i0}][${i1}][${i2}].arr[${i3}].key.key1`, message: "Musí být objekt" };
                        if (typeof item_i3.key.key1.mykey !== "string") throw { path: `mySchema.j.key[${i0}][${i1}][${i2}].arr[${i3}].key.key1.mykey`, message: "Musí být string" };
                        if (typeof item_i3.key.key1.youkey !== "number") throw { path: `mySchema.j.key[${i0}][${i1}][${i2}].arr[${i3}].key.key1.youkey`, message: "Musí být číslo" };
                    }
                }
            }
        }
        return data;
    }
};


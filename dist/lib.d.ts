export type Infer<T extends {
    parse: any;
}> = ReturnType<T['parse']>;
export interface Field<T, S extends boolean = false> {
    _type: T;
    _standalone: S;
    isStandalone: boolean;
    standalone(): Field<T, true>;
    parse(data: unknown): T;
}
export type CompiledSchema<T> = {
    parse: (data: unknown) => T extends Field<infer U, any> ? U : never;
} & (T extends ObjectField<infer Shape, any> ? {
    fields: {
        [K in keyof Shape as Shape[K]['_standalone'] extends true ? K : never]: {
            parse: (data: unknown) => Shape[K]['_type'];
        };
    };
} : {});
declare class CoreField<T, S extends boolean = false> implements Field<T, S> {
    parserFn: (data: unknown) => T;
    _type: T;
    _standalone: S;
    isStandalone: boolean;
    constructor(parserFn: (data: unknown) => T);
    standalone(): CoreField<T, true>;
    parse(data: unknown): T;
}
export declare class ObjectField<Shape extends Record<string, Field<any, any>>, S extends boolean = false> extends CoreField<{
    [K in keyof Shape]: Shape[K]['_type'];
}, S> {
    shape: Shape;
    constructor(shape: Shape);
    extend<NewShape extends Record<string, any>>(newShape: NewShape): ObjectField<Shape & NewShape, false>;
    standalone(): ObjectField<Shape, true>;
}
export declare class ArrayField<Inner extends Field<any, any>, S extends boolean = false> extends CoreField<Array<Inner['_type']>, S> {
    inner: Inner;
    constructor(inner: Inner);
    standalone(): ArrayField<Inner, true>;
}
export declare const lib: {
    string: (options?: {
        regex?: RegExp;
        message?: string;
    }) => CoreField<string, false>;
    number: () => CoreField<number, false>;
    boolean: () => CoreField<boolean, false>;
    email: (msg?: string) => CoreField<string, false>;
    file: (msg?: string) => CoreField<File, false>;
    object: <T extends Record<string, Field<any, any>>>(shape: T) => ObjectField<T, false>;
    array: <T extends Field<any, any>>(inner: T) => ArrayField<T, false>;
    compile: <T extends Field<any, any>>(rootField: T) => CompiledSchema<T>;
};
export {};
//# sourceMappingURL=lib.d.ts.map
export declare const contactDef: import("./lib.js").ObjectField<{
    email: {
        _type: string;
        _standalone: false;
        isStandalone: boolean;
        parserFn: (data: unknown) => string;
        standalone(): {
            _type: string;
            _standalone: true;
            isStandalone: boolean;
            parserFn: (data: unknown) => string;
            standalone(): /*elided*/ any;
            parse(data: unknown): string;
        };
        parse(data: unknown): string;
    };
    isActive: {
        _type: boolean;
        _standalone: false;
        isStandalone: boolean;
        parserFn: (data: unknown) => boolean;
        standalone(): {
            _type: boolean;
            _standalone: true;
            isStandalone: boolean;
            parserFn: (data: unknown) => boolean;
            standalone(): /*elided*/ any;
            parse(data: unknown): boolean;
        };
        parse(data: unknown): boolean;
    };
}, false>;
//# sourceMappingURL=a.d.ts.map
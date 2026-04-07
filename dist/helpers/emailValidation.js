// src/helpers/emailValidation.ts
export const emailValidation = (value) => {
    if (typeof value !== 'string')
        return false;
    const atIndex = value.indexOf('@');
    return atIndex > 0 && atIndex < value.length - 1 && value.includes('.', atIndex);
};
//# sourceMappingURL=emailValidation.js.map
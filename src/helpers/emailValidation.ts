// src/helpers/emailValidation.ts

export const emailValidation = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const atIndex = value.indexOf('@');
  return atIndex > 0 && atIndex < value.length - 1 && value.includes('.', atIndex);
};

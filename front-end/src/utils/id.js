/** Generates a UUID using the Web Crypto API built into all modern browsers */
export const generateId = () => crypto.randomUUID()

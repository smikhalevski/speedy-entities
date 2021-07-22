export function die(message: string): never {
  throw new Error(message);
}

export const fromCharCode = String.fromCharCode;

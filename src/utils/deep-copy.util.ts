export function deepCopy<T>(entity: T): T {
  return structuredClone(entity);
}

export function deepCopy<T>(entity: T): T {
  return JSON.parse(JSON.stringify(entity)) as T;
}

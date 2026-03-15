/**
 * Creates a deep clone of the given entity using `structuredClone`.
 *
 * @param entity - The value to clone.
 * @returns A deep copy of the entity.
 */
export function deepCopy<T>(entity: T): T {
  return structuredClone(entity);
}

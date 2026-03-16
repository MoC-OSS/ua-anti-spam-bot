/**
 * Removes duplicate values from an array using a Set.
 * @template T
 * @param array
 * @returns
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

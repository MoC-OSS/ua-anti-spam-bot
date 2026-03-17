/**
 * Removes duplicate values from an array using a Set.
 * @template T
 * @param array - The input array that may contain duplicate values
 * @returns A new array with duplicate values removed, preserving insertion order
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

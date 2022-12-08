/**
 * @template T
 * @param {T} array
 *
 * @returns {T}
 * */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

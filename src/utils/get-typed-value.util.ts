/**
 * Returns a function that accepts a value and enforces its type based on the type parameter.
 *
 * @template T - The expected type for the value.
 * @returns {(value: T) => T} A function that enforces the provided type for the input value.
 *
 * @example
 * ```ts
 * type MyUnion = 'value1' | 'value2' | 'value3';
 * const typedUnion = getTypedValue<MyUnion[]>()(['value1', 'value2']); // ('value1' | 'value2')[], not MyUnion[]
 * ```
 */
export const getTypedValue =
  <T>() =>
  <S extends T>(value: S): S =>
    value;

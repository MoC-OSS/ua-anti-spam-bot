/**
 Matches a JSON array.

 @category JSON
 */

export type CustomJsonArray = CustomJsonValue[];

/**
 Matches any valid JSON primitive value.

 @category JSON
 */
export type CustomJsonPrimitive = boolean | number | string | null | undefined;

/**
 Matches any valid JSON value.

 @see `Jsonify` if you need to transform a type to one that is assignable to `CustomJsonValue`.

 @category JSON
 */

export type CustomJsonValue = CustomJsonArray | CustomJsonObject | CustomJsonPrimitive;

export type CustomJsonObject = { [Key in string]: CustomJsonValue } & { [Key in string]?: CustomJsonValue | undefined };

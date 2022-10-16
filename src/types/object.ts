/**
 Matches a JSON array.

 @category JSON
 */
// eslint-disable-next-line no-use-before-define
export type CustomJsonArray = CustomJsonValue[];

/**
 Matches any valid JSON primitive value.

 @category JSON
 */
export type CustomJsonPrimitive = string | number | boolean | null | undefined;

/**
 Matches any valid JSON value.

 @see `Jsonify` if you need to transform a type to one that is assignable to `CustomJsonValue`.

 @category JSON
 */
// eslint-disable-next-line no-use-before-define
export type CustomJsonValue = CustomJsonPrimitive | CustomJsonObject | CustomJsonArray;

export type CustomJsonObject = { [Key in string]: CustomJsonValue } & { [Key in string]?: CustomJsonValue | undefined };

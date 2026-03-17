export type LooseAutocomplete<T extends string> = Omit<string, T> | T;

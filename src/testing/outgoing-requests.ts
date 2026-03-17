import type { RawApi } from 'grammy';
import type { Methods, Payload } from 'grammy/out/core/client';

import type { AbortSignal } from 'abort-controller';

/**
 * Request object, inherits from a grammy transformer
 */
export interface Request<TMethod extends Methods<RawApi> = Methods<RawApi>> {
  method: TMethod;
  payload: Payload<TMethod, RawApi>;
  signal?: AbortSignal;
}

export type RealApiMethodKeys = keyof RawApi;

/**
 * Collects outgoing requests and gives API to process these requests.
 * Helps to save typing.
 */
export class OutgoingRequests<TMethod extends RealApiMethodKeys = RealApiMethodKeys> {
  /**
   * Collected requests
   * @internal
   */
  requests: Request[] = [];

  /**
   * Get length of the requests
   * @returns The number of captured requests.
   */
  get length() {
    return this.requests.length;
  }

  /**
   * Builds an array of methods with strong and loose autocomplete
   * @param methods - Array of API method names to build.
   * @returns The same array typed as T[].
   */
  buildMethods<T extends TMethod>(methods: T[]): T[] {
    return methods;
  }

  /**
   * Get the outgoing request methods
   * @returns An array of API method names from all captured requests.
   */
  getMethods(): TMethod[] {
    return this.requests.map((request) => request.method as TMethod);
  }

  /**
   * Add request at the end
   * @param request - The outgoing request to append.
   * @returns The current instance for chaining.
   */
  push(request: Request<TMethod>): this {
    this.requests.push(request);

    return this;
  }

  /**
   * Clear all requests
   * @returns The current instance for chaining.
   */
  clear(): this {
    this.requests = [];

    return this;
  }

  /**
   * Returns the first captured outgoing request.
   * @returns first request
   */
  getFirst<TApi extends TMethod>(): Request<TApi> | null {
    return (this.requests[0] as Request<TApi>) || null;
  }

  /**
   * Returns the last captured outgoing request.
   * @returns last request
   */
  getLast<TApi extends TMethod>(): Request<TApi> | null {
    if (this.requests.length === 0) {
      return null;
    }

    return this.requests.at(-1) as Request<TApi>;
  }

  /**
   * Returns the two most recent captured outgoing requests.
   * @returns two last request
   */
  getTwoLast<TApi extends TMethod, TBot extends TMethod>() {
    return this.requests.slice(-2) as Partial<[Request<TApi>, Request<TBot>]>;
  }

  /**
   * Returns the three most recent captured outgoing requests.
   * @returns two last request
   */
  getThreeLast<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>() {
    return this.requests.slice(-3) as Partial<[Request<TApi>, Request<TBot>, Request<TContext>]>;
  }

  /**
   * Returns all typed requests
   */

  getAll<TApi extends TMethod>(): Partial<[Request<TApi>]>;

  getAll<TApi extends TMethod, TBot extends TMethod>(): Partial<[Request<TApi>, Request<TBot>]>;

  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod>(): Partial<
    [Request<TApi>, Request<TBot>, Request<TContext>]
  >;

  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod, TData extends TMethod>(): Partial<
    [Request<TApi>, Request<TBot>, Request<TContext>, Request<TData>]
  >;

  getAll<TApi extends TMethod, TBot extends TMethod, TContext extends TMethod, TData extends TMethod, TExtra extends TMethod>(): Partial<
    [Request<TApi>, Request<TBot>, Request<TContext>, Request<TData>, Request<TExtra>]
  >;

  getAll<
    TApi extends TMethod,
    TBot extends TMethod,
    TContext extends TMethod,
    TData extends TMethod,
    TExtra extends TMethod,
    TFilter extends TMethod,
  >(): Partial<[Request<TApi>, Request<TBot>, Request<TContext>, Request<TData>, Request<TExtra>, Request<TFilter>]>;

  getAll() {
    return this.requests as Partial<Request[]>;
  }
}

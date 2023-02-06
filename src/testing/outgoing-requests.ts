import type { AbortSignal } from 'abort-controller';
import type { RawApi } from 'grammy';
import type { Methods, Payload } from 'grammy/out/core/client';

/**
 * Request object, inherits from a grammy transformer
 * */
export interface Request<M extends Methods<RawApi> = Methods<RawApi>> {
  method: M;
  payload: Payload<M, RawApi>;
  signal?: AbortSignal;
}

export type RealApiMethodKeys = keyof RawApi;

/**
 * Collects outgoing requests and gives API to process these requests.
 * Helps to save typing.
 * */
export class OutgoingRequests<M extends RealApiMethodKeys = RealApiMethodKeys> {
  /**
   * Collected requests
   * @internal
   * */
  requests: Request[] = [];

  /**
   * Get length of the requests
   * */
  get length() {
    return this.requests.length;
  }

  /**
   * Add request at the end
   * */
  push(request: Request<M>): this {
    this.requests.push(request);
    return this;
  }

  /**
   * Clear all requests
   * */
  clear(): this {
    this.requests = [];
    return this;
  }

  /**
   * @returns first request
   * */
  getFirst<A extends M>(): Request<A> | null {
    return (this.requests[0] as Request<A>) || null;
  }

  /**
   * @returns last request
   * */
  getLast<A extends M>(): Request<A> | null {
    if (this.requests.length === 0) {
      return null;
    }

    return this.requests[this.requests.length - 1] as Request<A>;
  }

  /**
   * @returns two last request
   * */
  getTwoLast<A extends M, B extends M>() {
    return this.requests.slice(-2) as Partial<[Request<A>, Request<B>]>;
  }

  /**
   * @returns two last request
   * */
  getThreeLast<A extends M, B extends M, C extends M>() {
    return this.requests.slice(-3) as Partial<[Request<A>, Request<B>, Request<C>]>;
  }

  /**
   * Returns all typed requests
   * */
  /* eslint-disable prettier/prettier */
  getAll<A extends M>(): Partial<[Request<A>]>;

  getAll<A extends M, B extends M>(): Partial<[Request<A>, Request<B>]>;

  getAll<A extends M, B extends M, C extends M>(): Partial<[Request<A>, Request<B>, Request<C>]>;

  getAll<A extends M, B extends M, C extends M, D extends M>(): Partial<[Request<A>, Request<B>, Request<C>, Request<D>]>;

  getAll<A extends M, B extends M, C extends M, D extends M, E extends M>(): Partial<[Request<A>, Request<B>, Request<C>, Request<D>, Request<E>]>;
  /* eslint-enable prettier/prettier */

  getAll() {
    return this.requests as Partial<Request[]>;
  }
}

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

/**
 * Collects outgoing requests and gives API to process these requests.
 * Helps to saves typing.
 * */
export class OutgoingRequests {
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
  push(request: Request): this {
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
   * @returns last request
   * */
  getLast(): Request | null {
    if (this.requests.length === 0) {
      return null;
    }

    return this.requests[this.requests.length - 1];
  }

  /**
   * @returns two last request
   * */
  getTwoLast(): Request[] {
    return this.requests.slice(-2);
  }
}

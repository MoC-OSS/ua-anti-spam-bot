/* eslint-disable camelcase */
import { fileURLToPath } from 'node:url';
import MTProto from '@mtproto/core';
import type { JsonObject } from 'type-fest';

import { environmentConfig } from '../config';
import type { CheckPassword, MTProtoError, ProtoUpdate } from '../types';
import { sleep } from '../utils';

export interface LocalMTProto extends MTProto {
  call(method: string, parameters?: JsonObject, options?: JsonObject);
  setDefaultDc(number: number);
  crypto: {
    getSRPParams(parameters: JsonObject): Promise<Omit<CheckPassword, 'srp_id'>>;
  };
  updates: {
    on(type: string, callback: (updateInfo: ProtoUpdate) => any);
  };
}

export class API {
  mtproto: LocalMTProto;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    this.mtproto = new MTProto({
      api_id: environmentConfig.USERBOT_APP_ID,
      api_hash: environmentConfig.USERBOT_API_HASH,

      storageOptions: {
        path: fileURLToPath(new URL('data/1.json', import.meta.url)),
      },
    });
  }

  async call<T extends Record<string, any>>(method: string, parameters?: JsonObject, options: JsonObject = {}): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
      return await this.mtproto.call(method, parameters, options);
    } catch (error: unknown) {
      const typedError = error as MTProtoError;
      console.error(`${method} error:`, typedError);
      console.error(JSON.stringify(typedError));

      const { error_code, error_message } = typedError;

      if (error_code === 420) {
        const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
        const ms = seconds * 1000;

        await sleep(ms);

        return this.call(method, parameters, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split('_MIGRATE_');

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === 'PHONE') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }

        return this.call(method, parameters, options);
      }

      // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
      return Promise.reject(typedError);
    }
  }
}

export const api = new API();

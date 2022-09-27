/* eslint-disable camelcase */
import path from 'path';
import { env } from 'typed-dotenv'.config();
import MTProto from '@mtproto/core';
import { sleep } from '@mtproto/core/src/utils/common';

export class API {
  mtproto: typeof MTProto;
  constructor() {
    this.mtproto = new MTProto({
      api_id: env.USERBOT_APP_ID,
      api_hash: env.USERBOT_API_HASH,

      storageOptions: {
        path: path.resolve(__dirname, './data/1.json'),
      },
    });
  }

  async call(method, params, options = {}) {
    try {
      return await this.mtproto.call(method, params, options);
    } catch (error: any) {
      console.error(`${method} error:`, error);
      console.error(JSON.stringify(error));

      const { error_code, error_message } = error;

      if (error_code === 420) {
        const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
        const ms = seconds * 1000;

        await sleep(ms);

        return this.call(method, params, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split('_MIGRATE_');

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === 'PHONE') {
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }

        return this.call(method, params, options);
      }

      return Promise.reject(error);
    }
  }
}

const api = new API();

module.exports = api;

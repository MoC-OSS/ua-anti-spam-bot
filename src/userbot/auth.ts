/* eslint-disable camelcase */
import { environmentConfig } from '@shared/config';

import type { CheckPassword, MTProtoError } from '@app-types/mtproto/mtproto.types';

import { logger } from '@utils/logger.util';

import { api } from './api';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function checkPassword({ srp_id, A, M1 }: CheckPassword) {
  return api.call('auth.checkPassword', {
    password: {
      // eslint-disable-next-line no-secrets/no-secrets, @typescript-eslint/naming-convention
      _: 'inputCheckPasswordSRP',
      srp_id,
      A,
      M1,
    },
  });
}

async function getUser() {
  try {
    return await api.call('users.getFullUser', {
      id: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _: 'inputUserSelf',
      },
    });
  } catch {
    return null;
  }
}

function sendCode(phone: string) {
  return api.call('auth.sendCode', {
    phone_number: phone,
    settings: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _: 'codeSettings',
    },
  });
}

function signIn({ code, phone, phone_code_hash }) {
  return api.call('auth.signIn', {
    phone_code: code,
    phone_number: phone,
    phone_code_hash,
  });
}

function signUp({ phone, phone_code_hash }) {
  return api.call('auth.signUp', {
    phone_number: phone,
    phone_code_hash,
    first_name: 'MTProto',
    last_name: 'Core',
  });
}

function getPassword() {
  return api.call<Record<string, string>>('account.getPassword');
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const auth = async () => {
  const user = await getUser();

  if (!user) {
    logger.info('User is undefined, try to new connection');

    const phone = environmentConfig.USERBOT_LOGIN_PHONE;
    const code = environmentConfig.USERBOT_LOGIN_CODE;

    // const { code, phoneNumber: phone } = config;
    const { phone_code_hash } = await sendCode(phone);

    try {
      const signInResult = await signIn({
        code,
        phone,
        phone_code_hash,
      });

      if (signInResult._ === 'auth.authorizationSignUpRequired') {
        await signUp({
          phone,
          phone_code_hash,
        });
      }
    } catch (error: unknown) {
      if ((error as MTProtoError).error_message !== 'SESSION_PASSWORD_NEEDED') {
        logger.error(JSON.stringify(error));

        return api;
      }

      // 2FA

      // eslint-disable-next-line sonarjs/no-hardcoded-passwords
      const password = 'USER_PASSWORD';

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { srp_id, current_algo, srp_B } = await getPassword();
      // @ts-ignore
      const { g, p, salt1, salt2 } = current_algo;

      const { A, M1 } = await api.mtproto.crypto.getSRPParams({
        g,
        p,
        salt1,
        salt2,
        gB: srp_B,
        password,
      });

      const checkPasswordResult = await checkPassword({ srp_id, A, M1 });

      logger.info(checkPasswordResult);
    }
  }

  return api;
};

export default auth;

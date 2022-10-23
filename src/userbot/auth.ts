/* eslint-disable camelcase,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment,@typescript-eslint/no-unsafe-assignment */
import { environmentConfig } from '../config';
import type { CheckPassword } from '../types';

import { api } from './api';

export function checkPassword({ srp_id, A, M1 }: CheckPassword) {
  return api.call('auth.checkPassword', {
    password: {
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
  return api.call<any>('account.getPassword');
}

export default async () => {
  const user = await getUser();

  if (!user) {
    console.info('User is undefined, try to new connection');

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
    } catch (error: any) {
      if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
        console.error(JSON.stringify(error));

        return api;
      }

      // 2FA

      const password = 'USER_PASSWORD';

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
      console.info(checkPasswordResult);
    }
  }

  return api;
};

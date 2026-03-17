/* eslint-disable camelcase */
import { environmentConfig } from '@shared/config';

import type { CheckPassword, MTProtoError } from '@app-types/mtproto/mtproto.types';

import { logger } from '@utils/logger.util';

import { api } from './api';

/**
 * Verifies a Two-Factor Authentication password by calling auth.checkPassword via MTProto.
 * @param root0 - Destructured SRP authentication parameters.
 * @param root0.srp_id - The SRP session identifier.
 * @param root0.A - The client's SRP public key.
 * @param root0.M1 - The client's SRP proof.
 * @returns The result of the auth.checkPassword API call.
 */
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

/**
 * Retrieves the currently authenticated user's full profile via MTProto.
 * @returns The user's full profile object, or null if not authenticated.
 */
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

/**
 * Sends a verification code to the given phone number via MTProto.
 * @param phone - The phone number to send the code to.
 * @returns The API response containing the phone_code_hash.
 */
function sendCode(phone: string) {
  return api.call('auth.sendCode', {
    phone_number: phone,
    settings: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _: 'codeSettings',
    },
  });
}

/**
 * Signs in to Telegram using phone number, verification code, and code hash.
 * @param root0 - Destructured sign-in parameters.
 * @param root0.code - The verification code received via SMS.
 * @param root0.phone - The phone number used to request the code.
 * @param root0.phone_code_hash - The hash returned by sendCode.
 * @returns The result of the auth.signIn API call.
 */
function signIn({ code, phone, phone_code_hash }) {
  return api.call('auth.signIn', {
    phone_code: code,
    phone_number: phone,
    phone_code_hash,
  });
}

/**
 * Registers a new Telegram account using the phone number and code hash.
 * @param root0 - Destructured sign-up parameters.
 * @param root0.phone - The phone number to register.
 * @param root0.phone_code_hash - The hash returned by sendCode.
 * @returns The result of the auth.signUp API call.
 */
function signUp({ phone, phone_code_hash }) {
  return api.call('auth.signUp', {
    phone_number: phone,
    phone_code_hash,
    first_name: 'MTProto',
    last_name: 'Core',
  });
}

/**
 * Retrieves the current account password settings for Two-Factor Authentication.
 * @returns The account password settings from the MTProto API.
 */
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

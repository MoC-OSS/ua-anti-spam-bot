import * as typedDotenv from 'typed-dotenv';

const { error, env } = typedDotenv.config();

if (error) {
  // eslint-disable-next-line no-console
  console.error('Something wrong with env variables');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit();
}

export default env;

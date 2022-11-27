/**
 * @description File has been created to test redis performance and improve its logic,
 * Used only locally.
 * */
import { client, getAllChatRecords, getAllRecords, getAllUserRecords } from './redis';

const testPerformance = async <T>(callback: () => Promise<T> | T) => {
  const a = performance.now();

  const result = await callback();

  const b = performance.now();

  return {
    timeSpend: b - a,
    result,
  };
};

(async () => {
  console.info('Connecting...');
  await client.connect();

  console.info('Getting...');

  console.info('Test getAllRecords...');
  const getAllResult = await testPerformance(getAllRecords);
  console.info('Items', getAllResult.result.length);
  console.info('Time spent', getAllResult.timeSpend);

  console.info('Test getAllChatRecords...');
  const getAllChatResult = await testPerformance(getAllChatRecords);
  console.info('Items', getAllChatResult.result.records.length);
  console.info('Total Items', getAllChatResult.result.keys.length);
  console.info('Time spent', getAllChatResult.timeSpend);

  console.info('Test getAllUserRecords...');
  const getAllUserResult = await testPerformance(getAllUserRecords);
  console.info('Items', getAllUserResult.result.length);
  console.info('Time spent', getAllUserResult.timeSpend);

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
})().catch((error) => {
  console.error('Cannot read the values. Error:', error);
});

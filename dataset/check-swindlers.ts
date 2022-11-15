import fs from 'node:fs';
import axios from 'axios';

import { swindlersGoogleService } from '../src/services';
import type { SwindlerResponseBody } from '../src/types';

(async () => {
  const negatives = await swindlersGoogleService.getTrainingNegatives();

  const results = await Promise.all(
    negatives.map((message) =>
      axios.post<SwindlerResponseBody>(`http://localhost:3000/swindlers`, { message }).then((result) => ({
        message,
        ...result.data,
      })),
    ),
  );

  const invalidNegatives = results.filter((item) => item.result.isSpam);

  fs.writeFileSync('./temp/check-result.json', JSON.stringify(invalidNegatives, null, 2));
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
})().catch((error) => {
  console.error('Cannot run check-swindlers. Reason:', error);
});

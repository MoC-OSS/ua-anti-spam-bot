/* eslint-disable no-await-in-loop,no-restricted-syntax */
import fs from 'node:fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as input from 'input';
import dialogs = require('./dialogs.json');

export interface Dialog {
  href: string;
  title: string;
  subtitle: string;
  isValid?: boolean;
}

const typedDialogs = dialogs as Dialog[];

(async () => {
  for (const [dialogIndex, dialog] of typedDialogs.entries()) {
    if (dialog.isValid === undefined) {
      typedDialogs[dialogIndex].isValid = await input.confirm(`${dialog.title} - ${dialog.subtitle}`);

      fs.writeFileSync('./dialogs.json', JSON.stringify(typedDialogs, null, 2));
    }
  }

  fs.writeFileSync(
    './dialogs-rus.json',
    JSON.stringify(
      typedDialogs.filter((dialog) => dialog.isValid).map(({ href, title, subtitle }) => ({ href, title, subtitle })),
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error('Cannot run optimization due to:', error);
});

import { removeSystemInformationUtil } from '../remove-system-information.util';

describe('removeSystemInformationUtil', () => {
  it('should remove system information', () => {
    const message = `Looks like swindler's message (61.54%) from mention (@anna) by user @dmytro:

Переселенці
@anna 😊 А ви писали, що назавжди - те ж саме, тільки вже не фото листочка від руки написаного, а скріншот...`.trim();

    const expectedMessage = '@anna 😊 А ви писали, що назавжди - те ж саме, тільки вже не фото листочка від руки написаного, а скріншот...';

    expect(removeSystemInformationUtil(message)).toEqual(expectedMessage);
  });

  it('should not remove system information if not any', () => {
    const message = '@anna 😊 А ви писали, що назавжди - те ж саме, тільки вже не фото листочка від руки написаного, а скріншот...';
    const expectedMessage = '@anna 😊 А ви писали, що назавжди - те ж саме, тільки вже не фото листочка від руки написаного, а скріншот...';

    expect(removeSystemInformationUtil(message)).toEqual(expectedMessage);
  });
});

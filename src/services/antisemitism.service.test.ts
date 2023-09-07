import { antisemitismService } from './antisemitism.service';

describe('AntisemitismService', () => {
  it('should remove message with threads', () => {
    const message = 'Нос жидовский, как у меня';
    const actual = antisemitismService.checkAntisemitism(message);

    expect(actual).toBeTruthy();
  });

  it('should remove message with noun and action', () => {
    const message = 'этих евреев нужно сжигать. по другому никак';
    const actual = antisemitismService.checkAntisemitism(message);

    expect(actual).toBeTruthy();
  });

  it('should remove message with noun and obscene', () => {
    const message = 'хасид, иди на хуй!';
    const actual = antisemitismService.checkAntisemitism(message);

    expect(actual).toBeTruthy();
  });

  it('should not remove message with noun and a regular text', () => {
    const message = 'Миру мир, а евреям деньги';
    const actual = antisemitismService.checkAntisemitism(message);

    expect(actual).toBeNull();
  });
});

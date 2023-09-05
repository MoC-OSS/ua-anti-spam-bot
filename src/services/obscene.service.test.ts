import { obsceneService } from './obscene.service';

describe('ObsceneService', () => {
  it('should detect obscene messages', () => {
    const message = 'Цей виступ був АФІГЄНИй, і всі залишились безмовними від захвату.';
    const actual = obsceneService.checkObscene(message);

    expect(actual).toBeTruthy();
  });

  it('should not detect regular messages', () => {
    const message = 'Сонечко сьогодні палить класно.';
    const actual = obsceneService.checkObscene(message);

    expect(actual).toBeNull();
  });

  it('should not delete russian warship', () => {
    const message = 'Русский военный корабль, иди на хуй!';
    const actual = obsceneService.checkObscene(message);

    expect(actual).toBeNull();
  });
});

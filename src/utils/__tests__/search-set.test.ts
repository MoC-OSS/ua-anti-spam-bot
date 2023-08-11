import { SearchSet } from '../search-set';

describe('SearchSet', () => {
  it('should find a word if it in set', () => {
    const searchSet = new SearchSet(['афігєний']);
    const message = 'Цей виступ був АФІГЄНИй, і всі залишились безмовними від захвату.';
    const actual = searchSet.search(message);

    expect(actual).toStrictEqual({ found: 'афігєний', origin: 'афігєний', wordIndex: 3 });
  });

  it('should find a word with repeated letters in set', () => {
    const searchSet = new SearchSet(['афігєний']);
    const message = 'Цей виступ був АФІііііііГЄНИй, і всі залишились безмовними від захвату.';
    const actual = searchSet.search(message);

    expect(actual).toStrictEqual({ found: 'афігєний', origin: 'афііііііігєний', wordIndex: 3 });
  });

  it('should not detect regular messages', () => {
    const searchSet = new SearchSet(['афігєний']);
    const message = 'Сонечко сьогодні палить класно.';
    const actual = searchSet.search(message);

    expect(actual).toBeNull();
  });
});

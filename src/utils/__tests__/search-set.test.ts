import { SearchSet } from '../search-set';

describe('SearchSet', () => {
  it('should find word if it in set', () => {
    const searchSet = new SearchSet(['афігєний']);
    const message = 'Цей виступ був АФІГЄНИй, і всі залишились безмовними від захвату.';
    const actual = searchSet.search(message);

    expect(actual).toBe('афігєний');
  });

  it('should not detect regular messages', () => {
    const searchSet = new SearchSet(['афігєний']);
    const message = 'Сонечко сьогодні палить класно.';
    const actual = searchSet.search(message);

    expect(actual).toBeNull();
  });
});

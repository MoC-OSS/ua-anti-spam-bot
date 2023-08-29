import { censorWord } from '..';

describe('censorWord', () => {
  it('should censor a word', () => {
    const result = censorWord('anewword');

    expect(result).toEqual('a******d');
  });

  it('should censor short 3 letter word till end', () => {
    const result = censorWord('new');

    expect(result).toEqual('n**');
  });

  it('should censor short 2 letter word till end', () => {
    const result = censorWord('an');

    expect(result).toEqual('a*');
  });
});

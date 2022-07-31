const { Context } = require('grammy');
const { revealHiddenUrls } = require('./reveal-hidden-urls.util');

/**
 * @returns GrammyContext
 * */
const createCtx = (text, entities) => {
  const newCtx = new Context(
    {
      update_id: 324607000,
      message: {
        message_id: 9701,
        from: {},
        chat: {},
        date: 1659262017,
        text,
        entities,
      },
    },
    {
      raw: {},
      state: { text },
    },
    {
      id: 0,
      is_bot: true,
      first_name: 'MockUnitTest_bot',
      username: 'MockUnitTest_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    },
  );

  newCtx.state = {};
  newCtx.state.text = text;

  return newCtx;
};

describe('revealHiddenUrls', () => {
  it('should parse only url', () => {
    const text = 'test url';
    const entities = [{ offset: 0, length: 8, type: 'text_link', url: 'http://example.com/' }];

    const ctx = createCtx(text, entities);
    const result = revealHiddenUrls(ctx);

    expect(result).toEqual('http://example.com/');
  });

  it('should parse url in text', () => {
    const text = 'Допомога приват';
    const entities = [{ offset: 9, length: 6, type: 'text_link', url: 'https://example.com' }];

    const ctx = createCtx(text, entities);
    const result = revealHiddenUrls(ctx);

    expect(result).toEqual('Допомога https://example.com');
  });

  it('should parse multiple urls in the message', () => {
    const text = 'url1 text url2 text123 234 !@#$%^&*()_+-= url3';
    const entities = [
      { offset: 0, length: 4, type: 'text_link', url: 'http://example1.com/' },
      { offset: 10, length: 4, type: 'text_link', url: 'http://example2.com/' },
      { offset: 42, length: 4, type: 'text_link', url: 'http://example3.com/' },
    ];

    const ctx = createCtx(text, entities);
    const result = revealHiddenUrls(ctx);

    expect(result).toEqual('http://example1.com/ text http://example2.com/ text123 234 !@#$%^&*()_+-= http://example3.com/');
  });

  it('should not to be affected by bold', () => {
    const text = 'test some text url1 text bold url2';
    const entities = [
      { offset: 0, length: 4, type: 'bold' },
      { offset: 15, length: 4, type: 'text_link', url: 'http://example1.com/' },
      { offset: 25, length: 9, type: 'text_link', url: 'http://example2.com/' },
      { offset: 25, length: 9, type: 'bold' },
    ];

    const ctx = createCtx(text, entities);
    const result = revealHiddenUrls(ctx);

    expect(result).toEqual('test some text http://example1.com/ text http://example2.com/');
  });
});

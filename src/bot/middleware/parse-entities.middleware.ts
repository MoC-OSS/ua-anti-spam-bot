import type { GrammyMiddleware } from '@app-types/context';
import type { StateEntity } from '@app-types/state';

/**
 * It parses the value of entities and save it into the state
 * */
export const parseEntities: GrammyMiddleware = (context, next) => {
  const { text } = context.state;

  if (context.msg?.entities && text) {
    context.state.entities = context.msg.entities.map((entity): StateEntity => {
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (entity.type) {
        case 'text_link': {
          return {
            ...entity,
            value: entity.url,
          };
        }

        case 'text_mention': {
          return {
            ...entity,
            value: entity.user,
          };
        }

        default: {
          return {
            ...entity,
            value: text.slice(entity.offset, entity.offset + entity.length),
          };
        }
      }
    });
  }

  return next();
};

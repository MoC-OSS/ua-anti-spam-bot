import { getRandomItem } from '@utils/generic.util';

import type { DeleteObsceneMessageProperties } from './obscene.message';
import { getDeleteUserAtomMessage } from './shared.message';

/**
 * Messages to display when deleting content based on the denylist.
 */
export const deleteDenylistMessages = [
  '🚫 Ваше повідомлення було видалено, оскільки воно містить слова з нашого списку заборонених слів.🌟',
  '🚫 На жаль, ваше повідомлення порушує наші правила через використання заборонених слів. Дякуємо за розуміння. 🙏',
  '🚫 У нашій спільноті не допускається використання певних слів. Будь ласка, утримуйтесь від подібних висловів у майбутньому. 🌍',
  '🚫 Будь ласка, дотримуйтесь правил спільноти та уникайте використання заборонених слів у повідомленнях. Дякуємо за співпрацю! 🌈',
  '🚫 Повідомлення було видалено через використання слів зі списку заборонених. Будь ласка, будьте уважні до правил нашої спільноти. 🤝',
  '🚫 Ми цінуємо вашу участь, але просимо утримуватися від слів, що потрапляють у наш список заборонених виразів. Спасибі за розуміння! 🌟',
  '🚫 Заборонені слова не допускаються у нашій спільноті. Будь ласка, будьте свідомими щодо своїх висловлювань. 🙌',
  '🚫 Ми прагнемо до взаємоповаги та безпеки в спілкуванні. Будь ласка, утримуйтесь від використання заборонених слів. 🙏',
];

/**
 * Generates a message when deleting content based on the denylist.
 * @param {DeleteDenylistMessageProperties} params - Properties including username, user ID, and denylist word.
 * @returns {string} - The formatted message to be displayed.
 */
export const getDeleteDenylistMessage = ({ writeUsername, userId, word }: DeleteObsceneMessageProperties) => `
${getDeleteUserAtomMessage({ writeUsername, userId })} через слово "${word}"
${getRandomItem(deleteDenylistMessages)}
`;

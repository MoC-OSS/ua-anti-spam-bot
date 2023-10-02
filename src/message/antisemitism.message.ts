import type { DeleteObsceneMessageProperties } from '../message';
import { getDeleteUserAtomMessage } from '../message';
import { getRandomItem } from '../utils';

export const deleteAntisemitismMessages = [
  '🕊️ Нажаль, ваше повідомлення може містити образливий вміст, що порушує наші принципи толерантності. Будь ласка, утримуйтесь від антисемітських висловів. 🌈',
  '🕊️ У нас тут дотримуються високі стандарти поведінки, тож будьте обережні з вмістом, що може образити інших через антисемітизм. 🌟',
  "🕊️ Антисемітизм - неприйнятний у будь-якому вигляді. Будь ласка, пам'ятайте про наші правила та утримуйтесь від образливих висловів. 🚫",
  '🕊️ Ми вітаємо будь-які думки і ідеї, але прохання уникати антисемітизму в обговореннях. Разом ми будуємо співтовариство, де кожен поважається. 🌍',
  '🕊️ Антисемітизм суперечить нашим цінностям. Будь ласка, робіть висновки та утримуйтесь від образливих висловів. Дякуємо за розуміння. 🙏',
  '🕊️ Ми сприяємо взаєморозумінню та поваги до різних культур. Будьте уважними до інших користувачів та уникайте антисемітизму. 🤝',
  "🕊️ Важливо пам'ятати, що наше співтовариство базується на повазі та толерантності. Будь ласка, уникайте антисемітизму у вашому вмісті. 🌟",
  '🕊️ Антисемітизм не має місця в нашому чаті. Давайте залишимося відкритими для всіх і уникнемо образливих висловів. 🚫',
  '🕊️ Ми вітаємо різноманітність і різні думки, але прохання утриматися від антисемітизму в наших обговореннях. Дякуємо за розуміння. 🌈',
  '🕊️ Наша спільнота оберігає відкритий та поважний підхід до всіх користувачів. Будьте добрими один до одного і уникайте антисемітизму. 🌍',
  '🕊️ Нажаль, ваше повідомлення може містити образливий вміст, що порушує наші принципи толерантності. Будь ласка, утримуйтесь від антисемітизму. 🌈',
  '🕊️ У нас тут дотримуються високі стандарти поведінки, тож будьте обережні з вмістом, що може образити інших через антисемітизм. 🌟',
  "🕊️ Антисемітизм - неприйнятний у будь-якому вигляді. Будь ласка, пам'ятайте про наші правила та утримуйтесь від образливих висловів. 🚫",
  '🕊️ Ми вітаємо будь-які думки і ідеї, але прохання уникати антисемітизму в обговореннях. Разом ми будуємо співтовариство, де кожен поважається. 🌍',
  '🕊️ Антисемітизм суперечить нашим цінностям. Будь ласка, робіть висновки та утримуйтесь від образливих висловів. Дякуємо за розуміння. 🙏',
  '🕊️ Ми сприяємо взаєморозумінню та повази до різних культур. Будьте уважними до інших користувачів та уникайте антисемітизму. 🤝',
  "🕊️ Важливо пам'ятати, що наше співтовариство базується на повазі та толерантності. Будь ласка, уникайте антисемітизму у вашому вмісті. 🌟",
  '🕊️ Антисемітизм не має місця в нашому чаті. Давайте залишимося відкритими для всіх і уникнемо образливих висловів. 🚫',
  '🕊️ Ми вітаємо різноманітність і різні думки, але прохання утриматися від антисемітизму в наших обговореннях. Дякуємо за розуміння. 🌈',
  '🕊️ Наша спільнота оберігає відкритий та поважний підхід до всіх користувачів. Будьте добрими один до одного і уникайте антисемітизму. 🌍',
  '🕊️ Ми прагнемо до згуртованості і взаєморозуміння. Будьте обережні з виразами, що можуть образити через антисемітизм. 🤗',
  '🕊️ Антисемітизм не має місця у наших розмовах. Давайте залишимося відкритими для різних думок і поглядів. 🗣️',
  '🕊️ Ми вітаємо різноманітність і різні культури. Будьте обережні зі словами, що можуть порушити нашу толерантність. 🌍',
  '🕊️ Зверніть увагу, що антисемітизм неприпустимий в наших обговореннях. Будьте ввічливими та поважайте один одного. 🙌',
  '🕊️ Ми вітаємо різні думки, але прохання утримуйтесь від антисемітизму. Спільно ми створюємо позитивне середовище. 🌟',
  '🕊️ Антисемітизм суперечить нашій місії збереження толерантного співтовариства. Дякуємо за ваше розуміння. 🤝',
  '🕊️ Наша спільнота прагне до поваги та розуміння. Будьте обережні з виразами, які можуть образити через антисемітизм. 🌈',
  '🕊️ Уникайте антисемітизму в наших розмовах, щоб забезпечити взаємоповагу та толерантність. Дякуємо за співпрацю. 🤗',
  '🕊️ Важливо уникати антисемітизму у наших розмовах, щоб зберегти атмосферу поваги та різноманітності. 🌈',
  '🕊️ Антисемітизм суперечить нашим цілям створення позитивного та відкритого середовища. Будь ласка, бережіть слова. 🌟',
  '🕊️ Ми заохочуємо відкриті обговорення, але прохання уникати антисемітизму в своїх висловлюваннях. Разом ми сильніші. 🤝',
  '🕊️ Антисемітизм не має місця в нашій спільноті. Давайте спільно дбати про атмосферу поваги та розуміння. 🌍',
  '🕊️ У нас важливі принципи толерантності. Будь ласка, утримуйтесь від антисемітизму в комунікаціях. 🚫',
  '🕊️ Ми прагнемо до взаєморозуміння та співпраці. Будьте свідомими та уникайте антисемітизму. 🤗',
  '🕊️ Вітаємо всіх думок, але антисемітизм не має місця в наших обговореннях. Разом ми будуємо краще співтовариство. 🌈',
  '🕊️ Антисемітизм суперечить нашим цінностям різноманітності та взаєморозуміння. Дякуємо за повагу. 🙏',
  '🕊️ Ми завжди вітаємо різні точки зору, але прохання утриматися від антисемітизму в обговореннях. 🗣️',
  '🕊️ Антисемітизм негативно впливає на атмосферу у нашій спільноті. Будьте чутливими до цього питання. 🌟',
  '🕊️ Важливо дотримуватися наших правил та уникати антисемітизму. Ми разом для спільної поваги. 🤝',
  '🕊️ Ми цінуємо кожного користувача. Будьте обережні з виразами, що можуть образити через антисемітизм. 🌈',
  '🕊️ Антисемітизм суперечить нашому бажанню створити відкрите і гостинне співтовариство. Дякуємо за співпрацю. 🌍',
  '🕊️ Ми вітаємо ідеї та різні точки зору, але прохання утриматися від антисемітизму в дискусіях. 🌟',
  '🕊️ Антисемітизм не відображає дух нашого спільноти. Будьмо відкритими та позитивними у спілкуванні. 🚀',
  '🕊️ Ми прагнемо до розуміння та поваги. Будьте чутливими до вимог уникати антисемітизму. 🤗',
  '🕊️ В нашій спільноті не місце антисемітизму. Давайте зберігати співтовариство без образ. 🌍',
  '🕊️ Ми вітаємо всі голоси, але прохання залишити за порогом антисемітизм. Разом ми робимо спільність кращою. 🌟',
  '🕊️ Антисемітизм суперечить нашим цілям створення позитивного та толерантного середовища. Дякуємо за розуміння. 🙌',
  '🕊️ Ми прагнемо до доброзичливого та конструктивного спілкування. Будьте уважними до слів, що можуть образити через антисемітизм. 🌈',
];

export const getDeleteAntisemitismMessage = ({ writeUsername, userId, word }: DeleteObsceneMessageProperties) => `
${getDeleteUserAtomMessage({ writeUsername, userId })} по слову "${word}"

${getRandomItem(deleteAntisemitismMessages)}
`;
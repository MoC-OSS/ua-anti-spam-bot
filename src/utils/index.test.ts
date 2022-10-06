import { formatStateIntoAccusative } from './index';

describe('formatStateIntoAccusative', () => {
  const states = [
    'Вінницька область',
    'Волинська область',
    'Дніпропетровська область',
    'Донецька область',
    'Житомирська область',
    'Закарпатська область',
    'Запорізька область',
    'Івано-Франківська область',
    'Київська область',
    'Кіровоградська область',
    'Луганська область',
    'Львівська область',
    'Миколаївська область',
    'Одеська область',
    'Полтавська область',
    'Рівненська область',
    'Сумська область',
    'Тернопільська область',
    'Харківська область',
    'Херсонська область',
    'Хмельницька область',
    'Черкаська область',
    'Чернівецька область',
    'Чернігівська область',
    'м. Київ',
  ];

  const expectedStates = [
    'Вінницькій області',
    'Волинській області',
    'Дніпропетровській області',
    'Донецькій області',
    'Житомирській області',
    'Закарпатській області',
    'Запорізькій області',
    'Івано-Франківській області',
    'Київській області',
    'Кіровоградській області',
    'Луганській області',
    'Львівській області',
    'Миколаївській області',
    'Одеській області',
    'Полтавській області',
    'Рівненській області',
    'Сумській області',
    'Тернопільській області',
    'Харківській області',
    'Херсонській області',
    'Хмельницькій області',
    'Черкаській області',
    'Чернівецькій області',
    'Чернігівській області',
    'м. Київ',
  ];
  it('should format states right', () => {
    const newStates = states.map(formatStateIntoAccusative);

    expect(newStates).toEqual(expectedStates);
  });
});
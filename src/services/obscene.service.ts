import { dataset } from '../../dataset/dataset';
import { SearchSet } from '../utils';

export class ObsceneService {
  private readonly warshipAllowList = new SearchSet(['корабль', 'корабель', 'кораблю']);

  private readonly militaryAllowList = new SearchSet([
    'военний',
    'воєнний',
    'воений',
    'военный',
    'военый',
    'військовий',
    'русский',
    'російський',
  ]);

  checkObscene(message: string) {
    if (this.warshipAllowList.search(message) && this.militaryAllowList.search(message)) {
      return null;
    }

    return dataset.obscene_dictionary.search(message);
  }
}

export const obsceneService = new ObsceneService();

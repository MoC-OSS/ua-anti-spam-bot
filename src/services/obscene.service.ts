/**
 * @module obscene.service
 * @description Detects obscene/profane language in messages using keyword sets and allow-lists
 * for military and warship contexts where such terms are acceptable.
 */

import type { SearchSetTokens } from '@utils/search-set.util';
import { SearchSet } from '@utils/search-set.util';

import { dataset } from '../../dataset/dataset';

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

  checkObscene(message: SearchSetTokens | string) {
    if (this.warshipAllowList.search(message) && this.militaryAllowList.search(message)) {
      return null;
    }

    return dataset.obscene_dictionary.search(message);
  }
}

export const obsceneService = new ObsceneService();

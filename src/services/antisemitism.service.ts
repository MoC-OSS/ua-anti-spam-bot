import { dataset } from '../../dataset/dataset';
import { SearchSet } from '../utils/search-set';

import { ObsceneService } from './obscene.service';

export class AntisemitismService {
  private genericSet = new SearchSet();

  constructor(private obsceneService: ObsceneService) {}

  checkAntisemitism(message: string) {
    const tokens = this.genericSet.tokenize(message);

    const foundThread = dataset.antisemitism_dictionary.threads.search(tokens);

    if (foundThread) {
      return foundThread;
    }

    const foundNoun = dataset.antisemitism_dictionary.nouns.search(tokens);

    if (!foundNoun) {
      return null;
    }

    const foundAction = dataset.antisemitism_dictionary.action.search(tokens);

    if (foundAction) {
      return foundAction;
    }

    return this.obsceneService.checkObscene(tokens);
  }
}

export const antisemitismService = new AntisemitismService(new ObsceneService());

import { dataset } from '../../dataset/dataset';

export class ObsceneService {
  checkObscene(message: string) {
    return dataset.obscene_dictionary.search(message);
  }
}

export const obsceneService = new ObsceneService();

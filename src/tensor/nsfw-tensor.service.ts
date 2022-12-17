import * as tf from '@tensorflow/tfjs-node';
import type { NSFWJS, predictionType } from 'nsfwjs';
import * as nsfw from 'nsfwjs';

import type { NsfwTensorNegativeResult, NsfwTensorPositiveResult, NsfwTensorResult } from '../types';

export class NsfwTensorService {
  model!: NSFWJS;

  constructor(private modelPath: string) {}

  async load() {
    this.model = await nsfw.load();
  }

  async classify(image: Buffer): Promise<predictionType[]> {
    const tensor3d = tf.node.decodeImage(image, 3);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const predictions = await this.model.classify(tensor3d);
    tensor3d.dispose(); // Tensor memory must be managed explicitly (it is not sufficient to let a tf.Tensor go out of scope for its memory to be released).

    return predictions;
  }

  async predict(image: Buffer): Promise<NsfwTensorResult> {
    const predictions = await this.classify(image);

    const predictionChecks = new Map<predictionType['className'], number>();
    predictionChecks.set('Hentai', 0.7);
    predictionChecks.set('Porn', 0.7);
    predictionChecks.set('Sexy', 0.7);

    let highestPrediction!: predictionType;

    const deletePrediction = predictions.find((currentPrediction) => {
      const spamThreshold = predictionChecks.get(currentPrediction.className);

      if (!spamThreshold) {
        return false;
      }

      const isNoHighestPredictionYet = !highestPrediction;
      const isMoreHighPrediction = highestPrediction && currentPrediction.probability > highestPrediction.probability;

      if (isNoHighestPredictionYet || isMoreHighPrediction) {
        highestPrediction = currentPrediction;
      }

      return currentPrediction.probability > spamThreshold;
    });

    if (!deletePrediction) {
      return {
        isSpam: false,
        predictions,
        highestPrediction,
      } as NsfwTensorNegativeResult;
    }

    return {
      isSpam: true,
      predictions,
      deletePrediction,
      deleteRank: predictionChecks.get(deletePrediction.className),
    } as NsfwTensorPositiveResult;
  }
}

export const initNsfwTensor = async () => {
  // eslint-disable-next-line unicorn/prefer-module
  const tensorService = new NsfwTensorService(`${__dirname}/nsfw-temp/model.json`);
  await tensorService.load();

  return tensorService;
};

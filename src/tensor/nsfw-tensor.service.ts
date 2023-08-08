import * as tf from '@tensorflow/tfjs-node';
import type { NSFWJS, predictionType } from 'nsfwjs';
import * as nsfw from 'nsfwjs';

import type { NsfwTensorNegativeResult, NsfwTensorPositiveResult, NsfwTensorResult } from '../types';

export class NsfwTensorService {
  model!: NSFWJS;

  readonly predictionChecks = new Map<predictionType['className'], number>([
    ['Hentai', 0.85],
    ['Porn', 0.85],
    ['Sexy', 0.8],
  ]);

  constructor(private modelPath: URL) {}

  async load() {
    this.model = await nsfw.load(this.modelPath.toString());
  }

  async classify(image: Buffer): Promise<predictionType[]> {
    const tensor3d = tf.node.decodeImage(image, 3);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const predictions = await this.model.classify(tensor3d);
    tensor3d.dispose(); // Tensor memory must be managed explicitly (it is not sufficient to let a tf.Tensor go out of scope for its memory to be released).

    return predictions;
  }

  /**
   * Classifies a video from the 5 classes returning a map of
   * the most likely class names to their probability.
   *
   * @param imageArray
   */
  classifyVideo(imageArray: Buffer[]): Promise<predictionType[][]> {
    return Promise.all(imageArray.map((image) => this.classify(image)));
  }

  /**
   * @returns prediction result for a frame
   * */
  async predict(image: Buffer): Promise<NsfwTensorResult> {
    const predictions = await this.classify(image);

    const { deletePrediction, highestPrediction } = this.findHighestPrediction(predictions);

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
      deleteRank: this.predictionChecks.get(deletePrediction.className),
    } as NsfwTensorPositiveResult;
  }

  /**
   * @returns prediction result for array of image frames
   * */
  async predictVideo(imageArray: Buffer[]): Promise<NsfwTensorResult> {
    const framesPredictions = await this.classifyVideo(imageArray);

    let highestPrediction!: predictionType;
    let deletePrediction: predictionType | undefined;

    framesPredictions.some((predictions) => {
      const predictionResult = this.findHighestPrediction([highestPrediction, ...predictions].filter(Boolean));
      deletePrediction = predictionResult.deletePrediction;
      highestPrediction = predictionResult.highestPrediction;

      return !!deletePrediction;
    });

    if (!deletePrediction) {
      return {
        isSpam: false,
        predictions: framesPredictions,
        highestPrediction,
      } as NsfwTensorNegativeResult;
    }

    return {
      isSpam: true,
      predictions: framesPredictions,
      deletePrediction,
      deleteRank: this.predictionChecks.get(deletePrediction.className),
    } as NsfwTensorPositiveResult;
  }

  /**
   * @description finds highest and delete prediction
   * */
  private findHighestPrediction(predictions: predictionType[]) {
    let highestPrediction!: predictionType;

    const deletePrediction = predictions.find((currentPrediction) => {
      const spamThreshold = this.predictionChecks.get(currentPrediction.className);

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

    return { highestPrediction, deletePrediction };
  }
}

export const initNsfwTensor = async () => {
  const tensorService = new NsfwTensorService(new URL('nsfw-temp/model.json', import.meta.url));
  await tensorService.load();

  return tensorService;
};

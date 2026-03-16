/**
 * @module nsfw-tensor.service
 * @description NSFW image classification service powered by NSFWJS (TensorFlow.js).
 * Classifies images as Hentai, Porn, Sexy, or safe content.
 */

import type { NSFWJS, PredictionType } from 'nsfwjs';
import * as nsfw from 'nsfwjs';

import { environmentConfig } from '@shared/config';

import * as tf from '@tensorflow/tfjs-node';

import type { NsfwTensorNegativeResult, NsfwTensorPositiveResult, NsfwTensorResult } from '@app-types/nsfw';

import { logger } from '@utils/logger.util';

export class NsfwTensorService {
  model!: NSFWJS;

  readonly predictionChecks = new Map<PredictionType['className'], number>([
    ['Hentai', 0.85],
    ['Porn', 0.85],
    ['Sexy', 0.8],
  ]);

  /** Loads the InceptionV3 NSFW classification model. */
  async load() {
    this.model = await nsfw.load('InceptionV3');
  }

  /**
   * Decodes an image buffer into a 3D tensor, runs NSFW classification, and disposes the tensor.
   * @param image - Raw image buffer to classify.
   * @returns An array of prediction results sorted by probability.
   */
  async classify(image: Buffer): Promise<PredictionType[]> {
    const tensor3d = tf.node.decodeImage(image, 3);

    // @ts-ignore
    const predictions = await this.model.classify(tensor3d);

    tensor3d.dispose(); // Tensor memory must be managed explicitly (it is not sufficient to let a tf.Tensor go out of scope for its memory to be released).

    return predictions;
  }

  /**
   * Classifies multiple video frames in parallel and returns predictions for each.
   * @param imageArray - Array of image buffers (one per video frame).
   * @returns A promise resolving to an array of prediction arrays, one per frame.
   */
  classifyVideo(imageArray: Buffer[]): Promise<PredictionType[][]> {
    return Promise.all(imageArray.map((image) => this.classify(image)));
  }

  /**
   * Classifies a single image and returns a spam/safe verdict with the highest prediction.
   * @param image - Raw image buffer to classify.
   * @returns Prediction result for the image frame.
   */
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
   * Classifies an array of video frames and returns a combined spam/safe verdict.
   * Stops early if any frame exceeds the spam threshold.
   * @param imageArray - Array of image buffers representing video frames.
   * @returns Aggregated prediction result across all frames.
   */
  async predictVideo(imageArray: Buffer[]): Promise<NsfwTensorResult> {
    const framesPredictions = await this.classifyVideo(imageArray);

    let highestPrediction!: PredictionType;
    let deletePrediction: PredictionType | undefined;

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
   * Finds the highest NSFW prediction and the first prediction that exceeds the class threshold.
   * @param predictions - Array of NSFW prediction results to analyze.
   * @returns An object containing the highest prediction and the first prediction exceeding its threshold.
   */
  private findHighestPrediction(predictions: PredictionType[]) {
    let highestPrediction!: PredictionType;

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

/**
 * Creates and initializes an {@link NsfwTensorService} instance.
 * Skips model loading during unit tests.
 * @returns A fully initialized NsfwTensorService instance.
 */
export const initNsfwTensor = async () => {
  const tensorService = new NsfwTensorService();

  if (!environmentConfig.UNIT_TESTING) {
    logger.info('Loading NSFW tensor model...');
    const start = Date.now();

    await tensorService.load();
    logger.info(`NSFW tensor model loaded in ${((Date.now() - start) / 1000).toFixed(2)}s.`);
  }

  return tensorService;
};

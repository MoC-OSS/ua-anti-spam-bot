/**
 * @module base-tensor.service
 * @description Abstract base class for TensorFlow.js text classification services.
 * Handles model loading, vocabulary tokenization, text prediction, and training/export.
 */

import fs from 'node:fs';

import { optimizeText } from 'ukrainian-ml-optimizer';

import { environmentConfig } from '@shared/config';

import type { LayersModel } from '@tensorflow/tfjs';
import type { ModelArtifacts } from '@tensorflow/tfjs-core/dist/io/types';
import * as tf from '@tensorflow/tfjs-node';

import type { SwindlerTensorResult } from '@app-types/swindlers';

import { logger } from '@utils/logger.util';

/**
 * Class that shares logic for tensor services
 * */
export class BaseTensorService {
  model: LayersModel | null = null;

  dictionary: string[] = [];

  modelArtifacts: ModelArtifacts | undefined;

  dictionaryExtras = {
    START: 0,
    UNKNOWN: 1,
    PAD: 2,
  };

  modelLength = 0;

  constructor(
    protected modelPath: string,
    protected spamThreshold: number,
  ) {}

  /**
   * Loads the model metadata (vocabulary and topology) from local JSON files.
   *
   * @param modelPath - Relative path to the model JSON file.
   * @param vocabPath - Relative path to the vocabulary JSON file.
   */
  loadModelMetadata(modelPath: string, vocabPath: string) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      this.dictionary = JSON.parse(fs.readFileSync(new URL(vocabPath, import.meta.url)).toString()) as string[];
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      this.modelArtifacts = JSON.parse(fs.readFileSync(new URL(modelPath, import.meta.url)).toString()) as ModelArtifacts;
    } catch (error) {
      logger.error('Cannot parse model! Reason:');
      logger.error(error);
    }

    // @ts-ignore

    this.modelLength = this.modelArtifacts?.modelTopology?.model_config?.config.layers[1].config.input_length as number;
  }

  /**
   * Updates the spam detection threshold used by {@link predict}.
   *
   * @param newThreshold - New threshold value (ignored if falsy or non-numeric).
   */
  setSpamThreshold(newThreshold: number | string | null) {
    if (newThreshold && +newThreshold) {
      this.spamThreshold = +newThreshold;
    }
  }

  /** Loads the TensorFlow LayersModel from the configured model path. */
  async loadModel() {
    const fullModelPath = new URL(this.modelPath, import.meta.url);

    this.model = await tf.loadLayersModel(fullModelPath.toString());
  }

  /**
   * Runs the loaded ML model on a text message and returns a spam probability result.
   *
   * @param word - The text to classify.
   * @param rate - Optional custom threshold override; falls back to the instance threshold.
   * @returns A promise resolving to the tensor prediction result with spam rate and verdict.
   */
  predict(word: string, rate: number | null): Promise<SwindlerTensorResult> {
    if (!this.model) {
      return Promise.resolve({
        spamRate: 0,
        deleteRank: rate || this.spamThreshold,
        isSpam: false,
        fileStat: null,
      } as unknown as SwindlerTensorResult);
    }

    const tensorRank = this.tokenize(word);
    const tensorPredict = this.model?.predict(tensorRank.tensor);
    const fullModelPath = new URL(this.modelPath, import.meta.url);

    const deleteRank = rate || this.spamThreshold;

    /** File stats for the model file, used in test-tensor mode. */
    let fileStat: fs.Stats | null = null;

    if (environmentConfig.TEST_TENSOR) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fileStat = fs.statSync(fullModelPath);
      } catch {
        fileStat = null;
      }
    }

    // @ts-ignore

    return tensorPredict?.data().then(
      (numericData: [number, number]) =>
        ({
          spamRate: numericData[1],
          deleteRank,
          isSpam: numericData[1] > deleteRank,
          fileStat,
        }) as SwindlerTensorResult,
    ) as Promise<SwindlerTensorResult>;
  }

  /**
   * Converts a text message into a fixed-length numeric tensor for model input.
   * Applies text optimization, dictionary lookup, and START/UNKNOWN/PAD encoding.
   *
   * @param message - The raw text to tokenize.
   * @returns An object with the token array and the corresponding TensorFlow tensor.
   */
  tokenize(message: string) {
    // Always start with the START token.
    const returnArray = [this.dictionaryExtras.START];

    // Convert sentence to lower case which ML Model expects
    // Strip all characters that are not alphanumeric or spaces
    // Then split on spaces to create a word array.
    const wordArray = optimizeText(message)
      .split(' ')
      .slice(0, this.modelLength - 1);

    let index = 0;

    // Loop through the words in the sentence you want to encode.
    // If word is found in dictionary, add that number else
    // you add the UNKNOWN token.
    wordArray.forEach((word) => {
      const encoding = this.dictionary.indexOf(word);

      returnArray.push(encoding === -1 ? this.dictionaryExtras.UNKNOWN : encoding);
      index += 1;
    });

    // Finally if the number of words was < the minimum encoding length
    // minus 1 (due to the start token), fill the rest with PAD tokens.
    while (index < this.modelLength - 1) {
      returnArray.push(this.dictionaryExtras.PAD);
      index += 1;
    }

    // Convert to a TensorFlow Tensor and return that.
    return {
      tokenArray: returnArray,
      tensor: tf.tensor([returnArray]),
    };
  }
}

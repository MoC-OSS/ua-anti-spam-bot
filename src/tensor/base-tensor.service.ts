/* eslint-disable unicorn/prefer-module */
import fs from 'node:fs';
import path from 'node:path';
import type { LayersModel } from '@tensorflow/tfjs';
import type { ModelArtifacts } from '@tensorflow/tfjs-core/dist/io/types';
import * as tf from '@tensorflow/tfjs-node';
import { optimizeText } from 'ukrainian-ml-optimizer';

import { environmentConfig } from '../config';
import type { SwindlerTensorResult } from '../types';

/**
 * Class that shares logic for tensor services
 * */
export class BaseTensorService {
  model: LayersModel | null = null;

  DICTIONARY: string[] = [];

  MODEL: ModelArtifacts | undefined;

  DICTIONARY_EXTRAS = {
    START: 0,
    UNKNOWN: 1,
    PAD: 2,
  };

  modelLength = 0;

  constructor(protected modelPath: string, protected SPAM_THRESHOLD: number) {}

  loadModelMetadata(modelPath: string, vocabPath: string) {
    try {
      this.DICTIONARY = JSON.parse(fs.readFileSync(path.join(__dirname, vocabPath)).toString()) as string[];
      this.MODEL = JSON.parse(fs.readFileSync(path.join(__dirname, modelPath)).toString()) as ModelArtifacts;
    } catch (error) {
      console.error('Cannot parse model! Reason:');
      console.error(error);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.modelLength = this.MODEL?.modelTopology?.model_config?.config.layers[1].config.input_length as number;
  }

  setSpamThreshold(newThreshold: number | null | string) {
    if (newThreshold && +newThreshold) {
      this.SPAM_THRESHOLD = +newThreshold;
    }
  }

  async loadModel() {
    const fullModelPath = path.join(__dirname, this.modelPath);

    this.model = await tf.loadLayersModel(`file://${fullModelPath}`);
  }

  predict(word: string, rate: number | null): Promise<SwindlerTensorResult> {
    const tensorRank = this.tokenize(word);
    const tensorPredict = this.model?.predict(tensorRank.tensor);
    const fullModelPath = path.join(__dirname, this.modelPath);

    const deleteRank = rate || this.SPAM_THRESHOLD;

    /**
     * @type {Stats | null}
     * */
    let fileStat: fs.Stats | null = null;

    if (environmentConfig.TEST_TENSOR) {
      try {
        fileStat = fs.statSync(fullModelPath);
      } catch {
        fileStat = null;
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    return tensorPredict?.data().then(
      (numericData: [number, number]) =>
        ({
          spamRate: numericData[1],
          deleteRank,
          isSpam: numericData[1] > deleteRank,
          tensorRank: tensorRank.tokenArray,
          fileStat,
        } as SwindlerTensorResult),
    ) as Promise<SwindlerTensorResult>;
  }

  tokenize(message: string) {
    // Always start with the START token.
    const returnArray = [this.DICTIONARY_EXTRAS.START];

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
      const encoding = this.DICTIONARY.indexOf(word);
      returnArray.push(encoding === -1 ? this.DICTIONARY_EXTRAS.UNKNOWN : encoding);
      index += 1;
    });

    // Finally if the number of words was < the minimum encoding length
    // minus 1 (due to the start token), fill the rest with PAD tokens.
    while (index < this.modelLength - 1) {
      returnArray.push(this.DICTIONARY_EXTRAS.PAD);
      index += 1;
    }

    // Convert to a TensorFlow Tensor and return that.
    return {
      tokenArray: returnArray,
      tensor: tf.tensor([returnArray]),
    };
  }
}

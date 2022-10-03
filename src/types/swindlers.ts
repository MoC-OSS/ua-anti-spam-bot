// TODO use when ts will be available
// export enum SwindlerTypeEnum {
//   SITE = 'site',
//   MENTION = 'mention',
//   CARD = 'card',
//   TENSOR = 'tensor',
//   COMPARE = 'compare',
//   NO_MATCH = 'no match',
// }

import fs from 'node:fs';

export type SwindlerType = 'site' | 'mention' | 'card' | 'tensor' | 'compare' | 'no match';

export interface SwindlersBaseResult {
  isSpam: boolean;
  rate: number;
}

export interface SwindlersBotsResult extends SwindlersBaseResult {
  nearestName?: string;
  currentName: string;
}

export interface SwindlersUrlsResult extends SwindlersBaseResult {
  nearestName?: string;
  currentName: string;
  redirectUrl: string;
}

export interface SwindlerTensorResult {
  spamRate: number;
  deleteRank: number;
  isSpam: boolean;
  tensorRank: number[];
  fileStat: fs.Stats;
}

export interface SwindlersResultSummary {
  foundSwindlerUrl?: SwindlersBaseResult | SwindlersUrlsResult | null;
  foundSwindlerMention?: SwindlersBotsResult | null;
  foundCard?: true | null;
  foundTensor?: SwindlerTensorResult;
  foundCompare?: {
    foundSwindler: boolean;
    spamRate: number;
  };
}

export interface SwindlersResult extends SwindlersBaseResult {
  reason: SwindlerType;
  displayReason?: string;
  match?: string;
  results: SwindlersResultSummary;
}

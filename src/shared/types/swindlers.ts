/**
 * @module swindlers
 * @description Type definitions for swindler detection results across all detection methods
 * (URL, bot, card, tensor ML, string comparison).
 */

import type fs from 'node:fs';

export type SwindlerType = 'card' | 'compare' | 'mention' | 'no match' | 'site' | 'tensor';

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
  fileStat: fs.Stats;
}

export interface SwindlersResultSummaryFoundCompare {
  foundSwindler: boolean;
  spamRate: number;
}

export interface SwindlersResultSummary {
  foundSwindlerUrl?: SwindlersBaseResult | SwindlersUrlsResult | null;
  foundSwindlerMention?: SwindlersBotsResult | null;
  foundCard?: true | null;
  foundTensor?: SwindlerTensorResult;
  foundCompare?: SwindlersResultSummaryFoundCompare;
}

export interface SwindlersResult extends SwindlersBaseResult {
  reason: SwindlerType;
  displayReason?: string;
  match?: string;
  results: SwindlersResultSummary;
}

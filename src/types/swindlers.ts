// TODO use when ts will be available
// export enum SwindlerTypeEnum {
//   SITE = 'site',
//   MENTION = 'mention',
//   CARD = 'card',
//   TENSOR = 'tensor',
//   COMPARE = 'compare',
//   NO_MATCH = 'no match',
// }

export type SwindlerType = 'site' | 'mention' | 'card' | 'tensor' | 'compare' | 'no match';

export interface SwindlersBaseResult {
  isSpam: boolean;
  rate: number;
}

export interface SwindlersBotsResult extends SwindlersBaseResult {
  nearestName?: string;
  currentName: string;
}

export interface SwindlersResult extends SwindlersBaseResult {
  reason: SwindlerType;
  displayReason?: string;
  match?: string;
  results: Record<any, any>;
}

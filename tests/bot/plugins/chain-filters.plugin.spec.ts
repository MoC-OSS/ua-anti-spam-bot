import type { Context } from 'grammy';

import { chainFilters } from '@bot/plugins/chain-filters.plugin';

const mockContext = {} as Partial<Context> as Context;

describe('chainFilters', () => {
  it('should chain if boolean is passed', () => {
    const isPositiveResult = chainFilters(100 > 20, 200 > 20, 300 > 20)(mockContext);
    const isNegativeResult = chainFilters(100 > 20, 0 > 20, 300 > 20)(mockContext);

    expect(isPositiveResult).toBeTruthy();
    expect(isNegativeResult).toBeFalsy();
  });

  it('should chain if object is passed', () => {
    const isPositiveResult = chainFilters({ isValid: true, isTest: true }, { isValid: true, isTest: true })(mockContext);
    const isNegativeResult = chainFilters({ isValid: true, isTest: false }, { isValid: true, isTest: true })(mockContext);

    expect(isPositiveResult).toBeTruthy();
    expect(isNegativeResult).toBeFalsy();
  });

  it('should chain if function is passed', () => {
    const mockFunction = vi.fn(() => true);

    const isPositiveResult = chainFilters(mockFunction, () => true)(mockContext);
    const isNegativeResult = chainFilters(mockFunction, () => false)(mockContext);

    expect(isPositiveResult).toBeTruthy();
    expect(isNegativeResult).toBeFalsy();
    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction).toHaveBeenNthCalledWith(1, mockContext);
    expect(mockFunction).toHaveBeenNthCalledWith(2, mockContext);
  });

  it('should chain if combined filters are passed', () => {
    const isPositiveResult = chainFilters(() => true, { isTrue: true }, true)(mockContext);
    const isNegativeResult = chainFilters(() => true, { isTrue: false }, true)(mockContext);

    expect(isPositiveResult).toBeTruthy();
    expect(isNegativeResult).toBeFalsy();
  });
});

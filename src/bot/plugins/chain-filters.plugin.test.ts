import type { Context } from 'grammy';

import { chainFilters } from './chain-filters.plugin';

const mockContext = {} as Partial<Context> as Context;

describe('chainFilters', () => {
  it('should chain if boolean is passed', () => {
    const positiveResult = chainFilters(100 > 20, 200 > 20, 300 > 20)(mockContext);
    const negativeResult = chainFilters(100 > 20, 0 > 20, 300 > 20)(mockContext);

    expect(positiveResult).toBeTruthy();
    expect(negativeResult).toBeFalsy();
  });

  it('should chain if object is passed', () => {
    const positiveResult = chainFilters({ isValid: true, isTest: true }, { isValid: true, isTest: true })(mockContext);
    const negativeResult = chainFilters({ isValid: true, isTest: false }, { isValid: true, isTest: true })(mockContext);

    expect(positiveResult).toBeTruthy();
    expect(negativeResult).toBeFalsy();
  });

  it('should chain if function is passed', () => {
    const mockFunction = jest.fn(() => true);

    const positiveResult = chainFilters(mockFunction, () => true)(mockContext);
    const negativeResult = chainFilters(mockFunction, () => false)(mockContext);

    expect(positiveResult).toBeTruthy();
    expect(negativeResult).toBeFalsy();
    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction).toHaveBeenNthCalledWith(1, mockContext);
    expect(mockFunction).toHaveBeenNthCalledWith(2, mockContext);
  });

  it('should chain if combined filters are passed', () => {
    const positiveResult = chainFilters(() => true, { isTrue: true }, true)(mockContext);
    const negativeResult = chainFilters(() => true, { isTrue: false }, true)(mockContext);

    expect(positiveResult).toBeTruthy();
    expect(negativeResult).toBeFalsy();
  });
});

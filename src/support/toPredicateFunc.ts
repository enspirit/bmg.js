import { Predicate, PredicateFunc, Tuple } from '../types';

export const toPredicateFunc = <T>(p: Predicate<T>): PredicateFunc<T> => {
  if (typeof(p) === 'function') {
    return p as PredicateFunc<T>;
  } else {
    const expected = p as Tuple<T>;
    return (t: Tuple<T>) => {
      return Object.keys(expected).every(k => t[k] === expected[k])
    }
  }
}

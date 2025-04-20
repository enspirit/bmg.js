import { Predicate, PredicateFunc, Tuple } from '../types';

export const toPredicateFunc = (p: Predicate): PredicateFunc => {
  if (typeof(p) === 'function') {
    return p as PredicateFunc;
  } else {
    const expected = p as Tuple;
    return (t: Tuple) => {
      return Object.keys(expected).every(k => t[k] === expected[k])
    }
  }
}

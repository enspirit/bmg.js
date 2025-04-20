import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';

describe('BMG.js', () => {
  it('exists', () => {
    expect(Bmg).not.toBe(undefined);
  });

  it('allows building relations', () => {
    const r = Bmg([
      {sid: 'S1', name: 'Smith'},
      {sid: 'S2', name: 'Jones'},
    ])
    expect(Bmg.isRelation(r)).toBeTruthy()
  })
});

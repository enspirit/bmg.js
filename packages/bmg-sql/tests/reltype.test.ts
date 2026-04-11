import { describe, it, expect } from 'vitest';
import { RelationType } from '../src';

describe('RelationType', () => {

  describe('knowsKeys', () => {
    it('returns false when no keys', () => {
      const t = RelationType.unknown(['sid', 'name', 'city']);
      expect(t.knowsKeys()).toBe(false);
    });

    it('returns true when keys exist', () => {
      const t = RelationType.withKey(['sid', 'name', 'city'], ['sid']);
      expect(t.knowsKeys()).toBe(true);
    });
  });

  describe('hasPreservedKey', () => {
    it('returns true when key is fully contained in projected attrs', () => {
      const t = RelationType.withKey(['sid', 'name', 'city'], ['sid']);
      expect(t.hasPreservedKey(['sid', 'name'])).toBe(true);
    });

    it('returns false when key is not fully contained', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid', 'name']]);
      expect(t.hasPreservedKey(['sid', 'city'])).toBe(false);
    });

    it('returns false when no keys known', () => {
      const t = RelationType.unknown(['sid', 'name']);
      expect(t.hasPreservedKey(['sid'])).toBe(false);
    });

    it('works with multiple candidate keys', () => {
      const t = new RelationType(['sid', 'email', 'name'], [['sid'], ['email']]);
      // Projecting to just email still preserves the email key
      expect(t.hasPreservedKey(['email', 'name'])).toBe(true);
      // Projecting to just name doesn't preserve any key
      expect(t.hasPreservedKey(['name'])).toBe(false);
    });
  });

  describe('project', () => {
    it('keeps keys that survive the projection', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid']]);
      const projected = t.project(['sid', 'name']);
      expect(projected.attrs).toEqual(['sid', 'name']);
      expect(projected.keys).toEqual([['sid']]);
    });

    it('drops keys that dont survive', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid', 'name']]);
      const projected = t.project(['name', 'city']);
      expect(projected.keys).toEqual([]);
    });
  });

  describe('allbut', () => {
    it('keeps keys that survive', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid']]);
      const result = t.allbut(['city']);
      expect(result.attrs).toEqual(['sid', 'name']);
      expect(result.keys).toEqual([['sid']]);
    });

    it('drops keys when key attr is removed', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid']]);
      const result = t.allbut(['sid']);
      expect(result.keys).toEqual([]);
    });
  });

  describe('rename', () => {
    it('renames attrs and keys', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid']]);
      const result = t.rename({ sid: 'supplier_id' });
      expect(result.attrs).toEqual(['supplier_id', 'name', 'city']);
      expect(result.keys).toEqual([['supplier_id']]);
    });
  });

  describe('extend', () => {
    it('adds attrs, keeps keys', () => {
      const t = new RelationType(['sid', 'name'], [['sid']]);
      const result = t.extend(['location']);
      expect(result.attrs).toEqual(['sid', 'name', 'location']);
      expect(result.keys).toEqual([['sid']]);
    });
  });

  describe('join', () => {
    it('merges attrs and keys', () => {
      const left = new RelationType(['sid', 'name'], [['sid']]);
      const right = new RelationType(['sid', 'qty'], [['sid']]);
      const result = left.join(right);
      expect(result.attrs).toEqual(['sid', 'name', 'qty']);
      // Combined key: sid (appears in both, deduped)
      expect(result.keys).toEqual([['sid']]);
    });

    it('cross-product of keys when different', () => {
      const left = new RelationType(['sid', 'name'], [['sid']]);
      const right = new RelationType(['pid', 'pname'], [['pid']]);
      const result = left.join(right);
      expect(result.keys).toEqual([['sid', 'pid']]);
    });
  });

  describe('summarize', () => {
    it('group-by columns become the key', () => {
      const t = new RelationType(['sid', 'name', 'city'], [['sid']]);
      const result = t.summarize(['city'], ['cnt']);
      expect(result.attrs).toEqual(['city', 'cnt']);
      expect(result.keys).toEqual([['city']]);
    });
  });
});

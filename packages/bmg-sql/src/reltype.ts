/**
 * RelationType — runtime schema info for SQL relations.
 *
 * Tracks attribute names and candidate keys so that processors can
 * skip DISTINCT when a projection preserves a key.
 *
 * A key is a set of attribute names that uniquely identifies a row.
 * A relation can have multiple candidate keys (e.g., primary key + unique index).
 */

/** A candidate key: a set of attribute names that uniquely identify a row */
export type Key = string[];

export class RelationType {
  /** Attribute names in this relation */
  readonly attrs: string[];
  /** Candidate keys (each is a set of attribute names) */
  readonly keys: Key[];

  constructor(attrs: string[], keys: Key[] = []) {
    this.attrs = attrs;
    this.keys = keys;
  }

  /** Does this type know about any keys? */
  knowsKeys(): boolean {
    return this.keys.length > 0;
  }

  /**
   * Check if a projection preserves at least one key.
   * A key is preserved if ALL its attributes are in the projected set.
   */
  hasPreservedKey(projectedAttrs: string[]): boolean {
    if (!this.knowsKeys()) return false;
    const attrSet = new Set(projectedAttrs);
    return this.keys.some(key => key.every(a => attrSet.has(a)));
  }

  /** Derive type after projection (keep only specified attrs) */
  project(attrs: string[]): RelationType {
    const attrSet = new Set(attrs);
    // Keep only keys whose attributes are all in the projection
    const survivingKeys = this.keys.filter(key => key.every(a => attrSet.has(a)));
    return new RelationType(attrs, survivingKeys);
  }

  /** Derive type after allbut (remove specified attrs) */
  allbut(butlist: string[]): RelationType {
    const butSet = new Set(butlist);
    const remaining = this.attrs.filter(a => !butSet.has(a));
    const remainSet = new Set(remaining);
    const survivingKeys = this.keys.filter(key => key.every(a => remainSet.has(a)));
    return new RelationType(remaining, survivingKeys);
  }

  /** Derive type after rename */
  rename(renaming: Record<string, string>): RelationType {
    const renamedAttrs = this.attrs.map(a => renaming[a] ?? a);
    const renamedKeys = this.keys.map(key =>
      key.map(a => renaming[a] ?? a)
    );
    return new RelationType(renamedAttrs, renamedKeys);
  }

  /** Derive type after extend (add new attributes, no new keys) */
  extend(newAttrs: string[]): RelationType {
    return new RelationType([...this.attrs, ...newAttrs], this.keys);
  }

  /** Derive type after join (merge attrs and keys) */
  join(right: RelationType): RelationType {
    const rightOnlyAttrs = right.attrs.filter(a => !this.attrs.includes(a));
    const merged = [...this.attrs, ...rightOnlyAttrs];
    // Combined keys: if both have keys, each left key combined with each right key
    let mergedKeys: Key[] = [];
    if (this.knowsKeys() && right.knowsKeys()) {
      for (const lk of this.keys) {
        for (const rk of right.keys) {
          mergedKeys.push([...new Set([...lk, ...rk])]);
        }
      }
    } else if (this.knowsKeys()) {
      mergedKeys = this.keys;
    } else if (right.knowsKeys()) {
      mergedKeys = right.keys;
    }
    return new RelationType(merged, mergedKeys);
  }

  /** Derive type after restrict (same attrs and keys) */
  restrict(): RelationType {
    return this;
  }

  /** Derive type after summarize */
  summarize(by: string[], aggNames: string[]): RelationType {
    // The group-by columns form a key if they weren't already
    const attrs = [...by, ...aggNames];
    const keys = by.length > 0 ? [by] : [];
    return new RelationType(attrs, keys);
  }

  /** Create a type with no keys */
  static unknown(attrs: string[]): RelationType {
    return new RelationType(attrs);
  }

  /** Create a type with a primary key */
  static withKey(attrs: string[], key: Key): RelationType {
    return new RelationType(attrs, [key]);
  }
}

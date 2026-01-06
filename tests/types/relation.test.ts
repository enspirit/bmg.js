/**
 * Type-level tests for the generic Relation<T> system.
 * These tests verify compile-time type safety.
 */
import { describe, it, expectTypeOf } from 'vitest';
import { Bmg } from 'src';
import type { Relation, Tuple } from 'src/types';

// Define a typed interface for testing
interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
}

interface Order {
  orderId: number;
  customerId: number;
  total: number;
}

describe('Type Safety', () => {

  describe('Bmg factory', () => {
    it('infers type from input array', () => {
      const r = Bmg([{ id: 1, name: 'Alice' }]);
      expectTypeOf(r.one()).toMatchTypeOf<{ id: number; name: string }>();
    });

    it('accepts explicit type parameter', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      expectTypeOf(r).toMatchTypeOf<Relation<Person>>();
    });

    it('returns untyped Relation when no type info', () => {
      const data: Tuple[] = [{ a: 1 }];
      const r = Bmg(data);
      expectTypeOf(r).toMatchTypeOf<Relation<Tuple>>();
    });
  });

  describe('one() and toArray()', () => {
    it('returns typed tuple from one()', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const tuple = r.one();
      expectTypeOf(tuple.id).toBeNumber();
      expectTypeOf(tuple.name).toBeString();
      expectTypeOf(tuple.age).toBeNumber();
    });

    it('returns typed array from toArray()', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const arr = r.toArray();
      expectTypeOf(arr).toMatchTypeOf<Person[]>();
    });
  });

  describe('project()', () => {
    it('narrows type to selected attributes', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const projected = r.project(['id', 'name']);
      expectTypeOf(projected.one()).toMatchTypeOf<{ id: number; name: string }>();
    });

    it('accepts valid attribute names only', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      // This should compile - valid attributes
      r.project(['id', 'name']);

      // @ts-expect-error - 'invalid' is not a valid attribute
      r.project(['invalid']);
    });
  });

  describe('allbut()', () => {
    it('removes specified attributes from type', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const result = r.allbut(['age', 'city']);
      expectTypeOf(result.one()).toMatchTypeOf<{ id: number; name: string }>();
    });
  });

  describe('restrict/where/exclude', () => {
    it('preserves type through restrict', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const filtered = r.restrict({ city: 'NYC' });
      expectTypeOf(filtered.one()).toMatchTypeOf<Person>();
    });

    it('provides typed tuple in predicate function', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      r.restrict(t => {
        expectTypeOf(t.age).toBeNumber();
        return t.age > 25;
      });
    });

    it('where is alias for restrict', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const filtered = r.where(t => t.age > 25);
      expectTypeOf(filtered).toMatchTypeOf<Relation<Person>>();
    });
  });

  describe('rename()', () => {
    it('transforms attribute names in type', () => {
      const r = Bmg<{ name: string; age: number }>([{ name: 'Alice', age: 30 }]);
      const renamed = r.rename({ name: 'fullName' });
      const tuple = renamed.one();
      // Check individual properties since mapped types can be tricky for toMatchTypeOf
      expectTypeOf(tuple.fullName).toBeString();
      expectTypeOf(tuple.age).toBeNumber();
    });
  });

  describe('extend()', () => {
    it('adds new attributes to type', () => {
      const r = Bmg<{ id: number; age: number }>([{ id: 1, age: 30 }]);
      const extended = r.extend({
        senior: (t) => t.age >= 65,
        label: (t) => `Person ${t.id}`
      });
      const tuple = extended.one();
      expectTypeOf(tuple.id).toBeNumber();
      expectTypeOf(tuple.age).toBeNumber();
      expectTypeOf(tuple.senior).toBeBoolean();
      expectTypeOf(tuple.label).toBeString();
    });
  });

  describe('constants()', () => {
    it('adds constant attributes to type', () => {
      const r = Bmg<{ id: number }>([{ id: 1 }]);
      const result = r.constants({ version: 1, active: true });
      const tuple = result.one();
      expectTypeOf(tuple.id).toBeNumber();
      expectTypeOf(tuple.version).toBeNumber();
      expectTypeOf(tuple.active).toBeBoolean();
    });
  });

  describe('join()', () => {
    it('combines types from both relations', () => {
      const people = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      // Use array to avoid variance issues with Relation<Order> vs Relation<Tuple>
      const orders: Order[] = [{ orderId: 100, customerId: 1, total: 50 }];

      const joined = people.join(orders, { id: 'customerId' });
      const tuple = joined.one();

      // Should have all Person attributes
      expectTypeOf(tuple.id).toBeNumber();
      expectTypeOf(tuple.name).toBeString();
      expectTypeOf(tuple.age).toBeNumber();

      // Should have Order attributes (minus the join key)
      expectTypeOf(tuple.orderId).toBeNumber();
      expectTypeOf(tuple.total).toBeNumber();
    });
  });

  describe('cross_product()', () => {
    it('combines all attributes from both relations', () => {
      const r1 = Bmg<{ a: number }>([{ a: 1 }]);
      const r2 = Bmg<{ b: string }>([{ b: 'x' }]);

      const product = r1.cross_product(r2);
      const tuple = product.one();

      expectTypeOf(tuple.a).toBeNumber();
      expectTypeOf(tuple.b).toBeString();
    });
  });

  describe('union/minus/intersect', () => {
    it('preserves type in set operations', () => {
      const r1 = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      const r2 = Bmg<Person>([{ id: 2, name: 'Bob', age: 25, city: 'LA' }]);

      expectTypeOf(r1.union(r2)).toMatchTypeOf<Relation<Person>>();
      expectTypeOf(r1.minus(r2)).toMatchTypeOf<Relation<Person>>();
      expectTypeOf(r1.intersect(r2)).toMatchTypeOf<Relation<Person>>();
    });
  });

  describe('matching/not_matching', () => {
    it('preserves left type in semi-joins', () => {
      const people = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);
      // Use array to avoid variance issues with Relation<Order> vs Relation<Tuple>
      const orders: Order[] = [{ orderId: 100, customerId: 1, total: 50 }];

      const matched = people.matching(orders, { id: 'customerId' });
      expectTypeOf(matched).toMatchTypeOf<Relation<Person>>();

      const notMatched = people.not_matching(orders, { id: 'customerId' });
      expectTypeOf(notMatched).toMatchTypeOf<Relation<Person>>();
    });
  });

  describe('group()', () => {
    it('creates nested relation type', () => {
      const r = Bmg<{ orderId: number; item: string; qty: number }>([
        { orderId: 1, item: 'A', qty: 10 }
      ]);

      const grouped = r.group(['item', 'qty'], 'items');
      const tuple = grouped.one();

      expectTypeOf(tuple.orderId).toBeNumber();
      // items should be a Relation of the grouped attributes
      expectTypeOf(tuple.items).toMatchTypeOf<Relation<{ item: string; qty: number }>>();
    });
  });

  describe('wrap()', () => {
    it('creates nested object type', () => {
      const r = Bmg<{ id: number; street: string; city: string }>([
        { id: 1, street: '123 Main', city: 'NYC' }
      ]);

      const wrapped = r.wrap(['street', 'city'], 'address');
      const tuple = wrapped.one();

      expectTypeOf(tuple.id).toBeNumber();
      expectTypeOf(tuple.address).toMatchTypeOf<{ street: string; city: string }>();
    });
  });

  describe('prefix/suffix', () => {
    it('transforms attribute names with prefix', () => {
      const r = Bmg<{ id: number; name: string }>([{ id: 1, name: 'Alice' }]);
      const prefixed = r.prefix('user_');
      const tuple = prefixed.one();

      expectTypeOf(tuple).toMatchTypeOf<{ user_id: number; user_name: string }>();
    });

    it('transforms attribute names with suffix', () => {
      const r = Bmg<{ id: number; name: string }>([{ id: 1, name: 'Alice' }]);
      const suffixed = r.suffix('_val');
      const tuple = suffixed.one();

      expectTypeOf(tuple).toMatchTypeOf<{ id_val: number; name_val: string }>();
    });
  });

  describe('yByX()', () => {
    it('returns correctly typed record', () => {
      const r = Bmg<{ id: number; name: string }>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      const byId = r.yByX('name', 'id');
      expectTypeOf(byId).toMatchTypeOf<Record<number, string>>();
    });
  });

  describe('transform()', () => {
    it('preserves type structure', () => {
      const r = Bmg<{ id: number; name: string }>([{ id: 1, name: 'Alice' }]);
      const transformed = r.transform({ name: v => (v as string).toUpperCase() });
      expectTypeOf(transformed).toMatchTypeOf<Relation<{ id: number; name: string }>>();
    });
  });

  describe('autowrap()', () => {
    it('returns untyped Relation (dynamic)', () => {
      const r = Bmg<{ id: number; user_name: string; user_email: string }>([
        { id: 1, user_name: 'Alice', user_email: 'alice@test.com' }
      ]);

      const autowrapped = r.autowrap();
      // autowrap loses type information (dynamic structure)
      expectTypeOf(autowrapped).toMatchTypeOf<Relation<Tuple>>();
    });
  });

  describe('method chaining', () => {
    it('preserves types through operator chain', () => {
      const r = Bmg<Person>([{ id: 1, name: 'Alice', age: 30, city: 'NYC' }]);

      const result = r
        .restrict(t => t.age > 25)
        .project(['id', 'name'])
        .rename({ name: 'fullName' });

      const tuple = result.one();
      // Check individual properties since mapped types can be tricky for toMatchTypeOf
      expectTypeOf(tuple.id).toBeNumber();
      expectTypeOf(tuple.fullName).toBeString();
    });
  });

});

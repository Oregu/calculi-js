import assert from 'assert';
import { parse } from '../src/calculus';

describe('Parser', () => {
  describe('for simple expressions', () => {
    it('should parse identity', () => {
      assert.deepEqual(parse('λx.x'), ['λ', 'x', 'x']);
    });

    it('should parse half Omega function', () => {
      assert.deepEqual(parse('λy.(y y)'), ['λ', 'y', ['y', 'y']]);
    });

    // it('should parse Omega function', () => {
    //   assert.deepEqual(parse('(λy.(y y))(λy.(y y))'), [['λ', 'y', ['y', 'y']], ['λ', 'y', ['y', 'y']]]);
    // });

    it('should parse nested lambdas', () => {
      assert.deepEqual(parse('λx.(λy.(y y) x x)'), ['λ', 'x', [['λ', 'y', ['y', 'y']], 'x', 'x']]);
    });

    it('should parse Church one', () => {
      assert.deepEqual(parse('λs.λz.(s(z))'), ['λ', 's', ['λ', 'z', ['s', ['z']]]]);
    });

    it('should parse Church two', () => {
      assert.deepEqual(parse('λs.λz.(s(s(z)))'), ['λ', 's', ['λ', 'z', ['s', ['s', ['z']]]]]);
    });
  });

  describe('for simplified syntax', () => {
    it('should parse no dot between lambdas expressions', () => {
      assert.deepEqual(parse('λsλz.s(z)'), ['λ', 's', ['λ', 'z', ['s', ['z']]]]);
    });

    it('should parse no dot between lambdas expressions', () => {
      assert.deepEqual(parse('λsz.s(z)'), ['λ', 's', ['λ', 'z', ['s', ['z']]]]);
    });
  });

  describe('Error', () => {
    it('should fail on incorrect expression', () => {
      assert.throws(() => parse('λy.y.y'), Error);
    });
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { visiblePhotoCount, wrappedPhotoIndex } from '../src/lib/galleryPagination.mjs';

test('exibe 24 fotografias por vez sem ultrapassar o total', () => {
  assert.equal(visiblePhotoCount(63), 24);
  assert.equal(visiblePhotoCount(63, 24), 48);
  assert.equal(visiblePhotoCount(63, 48), 63);
  assert.equal(visiblePhotoCount(13), 13);
  assert.equal(visiblePhotoCount(0), 0);
  assert.equal(visiblePhotoCount(10, 0, 4), 4);
  assert.throws(() => visiblePhotoCount(10, 0, 0), RangeError);
});

test('navega circularmente por toda a sequência', () => {
  assert.equal(wrappedPhotoIndex(-1, 63), 62);
  assert.equal(wrappedPhotoIndex(63, 63), 0);
  assert.equal(wrappedPhotoIndex(48, 63), 48);
  assert.throws(() => wrappedPhotoIndex(0, 0), RangeError);
});

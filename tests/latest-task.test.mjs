import test from 'node:test';
import assert from 'node:assert/strict';
import { createLatestTask } from '../js/core/latest-task.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('a slower earlier task cannot replace the latest result', async () => {
  const earlier = deferred();
  const latest = deferred();
  const results = [];
  const errors = [];
  const task = createLatestTask((result) => results.push(result), (error) => errors.push(error.message));

  const earlierRun = task.run(() => earlier.promise);
  const latestRun = task.run(() => latest.promise);
  latest.resolve('new selection');
  assert.equal(await latestRun, true);
  earlier.resolve('stale selection');
  assert.equal(await earlierRun, false);

  assert.deepEqual(results, ['new selection']);
  assert.deepEqual(errors, []);
});

test('reports only the latest task failure', async () => {
  const earlier = deferred();
  const latest = deferred();
  const errors = [];
  const task = createLatestTask(() => {}, (error) => errors.push(error.message));

  const earlierRun = task.run(() => earlier.promise);
  const latestRun = task.run(() => latest.promise);
  latest.reject(new Error('current failure'));
  assert.equal(await latestRun, false);
  earlier.reject(new Error('stale failure'));
  assert.equal(await earlierRun, false);

  assert.deepEqual(errors, ['current failure']);
});

test('invalidation cancels pending work before it can commit', async () => {
  const pending = deferred();
  const results = [];
  const task = createLatestTask((result) => results.push(result));
  const run = task.run(() => pending.promise);

  task.invalidate();
  pending.resolve('invalidated result');
  assert.equal(await run, false);
  assert.deepEqual(results, []);
});

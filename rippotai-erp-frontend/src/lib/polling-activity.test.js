import test from 'node:test';
import assert from 'node:assert/strict';
import { createPollingActivity, POLLING_IDLE_MS } from './polling-activity.js';

function setup() {
  let now = 0;
  let id = 0;
  const timers = new Map();
  const window = new EventTarget();
  const document = new EventTarget();
  document.hidden = false;
  const monitor = createPollingActivity({ window, document, now: () => now,
    setTimeout: (callback, delay) => { timers.set(++id, { callback, at: now + delay }); return id; },
    clearTimeout: timer => timers.delete(timer),
  });
  return { monitor, window, document, timers, advance(ms) {
    now += ms;
    for (const [key, timer] of [...timers]) if (timer.at <= now) {
      timers.delete(key); timer.callback();
    }
  } };
}

test('pauses polling after one idle minute and resumes on user activity', () => {
  const env = setup();
  const changes = [];
  const unsubscribe = env.monitor.subscribe(() => changes.push(env.monitor.getSnapshot()));
  env.advance(POLLING_IDLE_MS);
  assert.equal(env.monitor.canPoll(), false);
  env.window.dispatchEvent(new Event('pointerdown'));
  assert.equal(env.monitor.canPoll(), true);
  assert.deepEqual(changes, [false, true]);
  unsubscribe();
});

test('pauses immediately when hidden and resumes when the page becomes visible', () => {
  const env = setup();
  const unsubscribe = env.monitor.subscribe(() => {});
  env.document.hidden = true;
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(env.monitor.getSnapshot(), false);
  assert.equal(env.timers.size, 0);
  env.document.hidden = false;
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(env.monitor.getSnapshot(), true);
  unsubscribe();
});

test('shares one timer across subscribers and removes it after the last unmount', () => {
  const env = setup();
  const first = env.monitor.subscribe(() => {});
  const second = env.monitor.subscribe(() => {});
  assert.equal(env.timers.size, 1);
  first();
  assert.equal(env.timers.size, 1);
  second();
  assert.equal(env.timers.size, 0);
  env.window.dispatchEvent(new Event('pointerdown'));
  assert.equal(env.timers.size, 0);
});

test('recent interaction keeps polling active without repeatedly creating timers', () => {
  const env = setup();
  const unsubscribe = env.monitor.subscribe(() => {});
  env.advance(POLLING_IDLE_MS - 1000);
  env.window.dispatchEvent(new Event('keydown'));
  assert.equal(env.timers.size, 1);
  env.advance(1000);
  assert.equal(env.monitor.getSnapshot(), true);
  env.advance(POLLING_IDLE_MS - 1000);
  assert.equal(env.monitor.getSnapshot(), false);
  unsubscribe();
});

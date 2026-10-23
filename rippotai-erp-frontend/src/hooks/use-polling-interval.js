import { useSyncExternalStore } from 'react';
import { createPollingActivity } from '../lib/polling-activity.js';

const activity = createPollingActivity({ window, document });
export const canBackgroundPoll = activity.canPoll;

export function usePollingInterval(interval, enabled = true) {
  const active = useSyncExternalStore(activity.subscribe, activity.getSnapshot, () => false);
  return active && enabled ? interval : 0;
}

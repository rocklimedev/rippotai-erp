import { createHash } from 'crypto';

export function fingerprint(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function remoteRecord(response: any, kind: 'tasks' | 'calendar'): any {
  const data = response?.data ?? response;
  const record =
    data?.[kind === 'tasks' ? 'tasks' : 'events']?.[0] ??
    data?.[kind === 'tasks' ? 'task' : 'event'] ??
    data;
  return record;
}

export function remoteId(response: any, kind: 'tasks' | 'calendar'): string {
  const record = remoteRecord(response, kind);
  const id = record?.uid ?? record?.id_string ?? record?.id;
  if (!id || (typeof id === 'number' && !Number.isSafeInteger(id))) {
    throw new Error(
      'Zoho returned no safe remote ID; inspect the remote record before retrying creation.',
    );
  }
  return String(id);
}

export function calendarPayload(event: any, config: Record<string, any>) {
  const start = new Date(event.starts_at);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + (event.all_day ? 0 : 1800000));
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end < start ||
    (!event.all_day && end.getTime() === start.getTime())
  ) {
    throw new Error('Event must have valid start and end dates.');
  }
  const timezone = config.timezone || 'Asia/Kolkata';
  const format = (date: Date) => {
    if (!event.all_day)
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    return ['year', 'month', 'day']
      .map((key) => parts.find((p) => p.type === key)!.value)
      .join('');
  };
  return {
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    dateandtime: { start: format(start), end: format(end), timezone },
    isallday: Boolean(event.all_day),
    reminders: [
      { action: 'email', minutes: config.reminder_minutes ?? 30 },
      { action: 'popup', minutes: config.reminder_minutes ?? 30 },
    ],
  };
}

export function taskPayload(task: any, config: Record<string, any>) {
  return {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status === 'review' ? 'in_progress' : task.status,
    due_date: task.due_date ? new Date(task.due_date).toISOString() : undefined,
    start_date: task.start_date
      ? new Date(task.start_date).toISOString()
      : task.due_date
        ? new Date(task.due_date).toISOString()
        : undefined,
    tasklist_id: config.tasklist_id || undefined,
    assignee: config.assignee_id,
    reminderDate:
      task.status !== 'completed' && task.due_date
        ? new Date(task.due_date).toISOString()
        : undefined,
    reminder_time: config.task_reminder_time || '09:00',
    timezone: config.timezone || 'Asia/Kolkata',
  };
}

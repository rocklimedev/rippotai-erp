export const TASK_STATUSES = [
  { value: "todo", label: "To do", tone: "mute" },
  { value: "in_progress", label: "In progress", tone: "info" },
  { value: "review", label: "In review", tone: "lilac" },
  { value: "blocked", label: "Blocked", tone: "bad" },
  { value: "completed", label: "Done", tone: "ok" },
];
export const TASK_PRIORITIES = [
  { value: "low", label: "Low", tone: "mute" },
  { value: "medium", label: "Medium", tone: "info" },
  { value: "high", label: "High", tone: "peach" },
  { value: "critical", label: "Critical", tone: "bad" },
];
export const statusMeta = (v) => TASK_STATUSES.find((s) => s.value === v) || TASK_STATUSES[0];
export const priorityMeta = (v) => TASK_PRIORITIES.find((s) => s.value === v) || TASK_PRIORITIES[1];
export const isOverdue = (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type ViewState = 'board' | 'calendar' | 'reminders';

export interface Note {
  id: string;
  title?: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  linkedTaskIds: string[];
  userId?: string;
}

export interface Task {

  id: string;
  title: string;
  description?: string;
  groupId?: string;
  priority: TaskPriority;
  dueDate?: string | null; // ISO string
  estimatedEffort?: string; // e.g. "2h", "1d"
  status: TaskStatus;
  parentId?: string; // For subtasks
  dependencies: string[]; // Array of task IDs
  createdAt: string;
  reminderDays?: number; // Days before due date
  recurrence?: string | null;
  recurrenceEndDate?: string | null;
  recurrenceOccurrenceDate?: string | null;
}

export interface Group {
  id: string;
  name: string;
}

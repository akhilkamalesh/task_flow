export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  groupId?: string;
  priority: TaskPriority;
  dueDate?: string; // ISO string
  estimatedEffort?: string; // e.g. "2h", "1d"
  status: TaskStatus;
  parentId?: string; // For subtasks
  dependencies: string[]; // Array of task IDs
  createdAt: string;
  reminderDays?: number; // Days before due date
}

export interface Group {
  id: string;
  name: string;
}

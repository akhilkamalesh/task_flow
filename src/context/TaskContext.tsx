import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Task, Group } from '../types';

interface TaskContextType {
  tasks: Task[];
  groups: Group[];
  selectedGroups: string[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addGroup: (name: string) => void;
  deleteGroup: (id: string) => void;
  toggleGroupSelection: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('task_manager_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('task_manager_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Default group
    return [{ id: 'inbox', name: 'Inbox' }];
  });

  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('task_manager_selected_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore
      }
    }
    const savedGroups = localStorage.getItem('task_manager_groups');
    if (savedGroups) {
      try {
        return JSON.parse(savedGroups).map((g: Group) => g.id);
      } catch {
        // Ignore
      }
    }
    return ['inbox'];
  });

  useEffect(() => {
    localStorage.setItem('task_manager_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('task_manager_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('task_manager_selected_groups', JSON.stringify(selectedGroups));
  }, [selectedGroups]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => {
      // Also delete subtasks
      const toDelete = new Set([id]);
      let size = 0;
      // Recursively find all subtasks
      while (toDelete.size !== size) {
        size = toDelete.size;
        prev.forEach(t => {
          if (t.parentId && toDelete.has(t.parentId)) {
            toDelete.add(t.id);
          }
        });
      }
      return prev.filter(t => !toDelete.has(t.id));
    });
  };

  const addGroup = (name: string) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
    };
    setGroups(prev => [...prev, newGroup]);
    setSelectedGroups(prev => [...prev, newGroup.id]);
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setSelectedGroups(prev => prev.filter(gId => gId !== id));
    setTasks(prev => {
      const toDelete = new Set(prev.filter(t => t.groupId === id).map(t => t.id));
      let size = 0;
      // Recursively find all subtasks
      while (toDelete.size !== size) {
        size = toDelete.size;
        prev.forEach(t => {
          if (t.parentId && toDelete.has(t.parentId)) {
            toDelete.add(t.id);
          }
        });
      }
      return prev.filter(t => !toDelete.has(t.id));
    });
  };

  const toggleGroupSelection = (id: string) => {
    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  return (
    <TaskContext.Provider value={{ tasks, groups, selectedGroups, addTask, updateTask, deleteTask, addGroup, deleteGroup, toggleGroupSelection }}>
      {children}
    </TaskContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

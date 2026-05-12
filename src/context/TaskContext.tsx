import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Task, Group } from '../types';

interface TaskContextType {
  tasks: Task[];
  groups: Group[];
  selectedGroups: string[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addGroup: (name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  toggleGroupSelection: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('task_manager_selected_groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('task_manager_selected_groups', JSON.stringify(selectedGroups));
  }, [selectedGroups]);


  const fetchTasksAndGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (groupsError) throw groupsError;

      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      const mappedGroups: Group[] = groupsData.map(g => ({
        id: g.id,
        name: g.name
      }));

      const mappedTasks: Task[] = tasksData.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        groupId: t.group_id,
        priority: t.priority,
        dueDate: t.due_date,
        estimatedEffort: t.estimated_effort,
        status: t.status,
        parentId: t.parent_id,
        dependencies: t.dependencies || [],
        createdAt: t.created_at,
        reminderDays: t.reminder_days
      }));

      setGroups(mappedGroups);
      setTasks(mappedTasks);
      
      // Initialize selected groups if empty and we have groups
      if (selectedGroups.length === 0 && mappedGroups.length > 0) {
        setSelectedGroups(mappedGroups.map(g => g.id));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedGroups.length]);

  const migrateFromLocalStorage = useCallback(async () => {
    if (!user) return;

    const localTasks = localStorage.getItem('task_manager_tasks');
    const localGroups = localStorage.getItem('task_manager_groups');

    if (!localTasks && !localGroups) return;

    try {
      setLoading(true);
      let parsedGroups: Group[] = localGroups ? JSON.parse(localGroups) : [];
      let parsedTasks: Task[] = localTasks ? JSON.parse(localTasks) : [];

      // Ensure at least one group (Inbox)
      if (parsedGroups.length === 0) {
        parsedGroups = [{ id: 'inbox', name: 'Inbox' }];
      }

      // Step 1: Upload Groups
      // We need to handle ID mapping because Supabase uses UUIDs
      const groupMap = new Map<string, string>();
      
      for (const g of parsedGroups) {
        const { data, error } = await supabase
          .from('groups')
          .insert({ name: g.name, user_id: user.id })
          .select()
          .single();
        
        if (error) console.error('Error migrating group:', error);
        if (data) groupMap.set(g.id, data.id);
      }

      // Step 2: Upload Tasks
      // Need to handle parent_id mapping after all tasks are created
      const taskMap = new Map<string, string>();
      
      // First pass: Insert tasks without parent/dependencies
      for (const t of parsedTasks) {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title: t.title,
            description: t.description,
            group_id: groupMap.get(t.groupId || 'inbox'),
            priority: t.priority,
            due_date: t.dueDate,
            estimated_effort: t.estimatedEffort,
            status: t.status,
            user_id: user.id,
            reminder_days: t.reminderDays || 0
          })
          .select()
          .single();

        if (error) console.error('Error migrating task:', error);
        if (data) taskMap.set(t.id, data.id);
      }

      // Second pass: Update parent_id and dependencies
      for (const t of parsedTasks) {
        if (t.parentId || (t.dependencies && t.dependencies.length > 0)) {
          const updates: any = {};
          if (t.parentId) updates.parent_id = taskMap.get(t.parentId);
          if (t.dependencies) updates.dependencies = t.dependencies.map(d => taskMap.get(d)).filter(Boolean);

          await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskMap.get(t.id));
        }
      }

      // Clear localStorage
      localStorage.removeItem('task_manager_tasks');
      localStorage.removeItem('task_manager_groups');
      localStorage.removeItem('task_manager_selected_groups');

      await fetchTasksAndGroups();
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchTasksAndGroups]);

  useEffect(() => {
    if (user) {
      // Check if we need to migrate or just fetch
      const localTasks = localStorage.getItem('task_manager_tasks');
      if (localTasks) {
        migrateFromLocalStorage();
      } else {
        fetchTasksAndGroups();
      }
    } else {
      setTasks([]);
      setGroups([]);
      setLoading(false);
    }
  }, [user, fetchTasksAndGroups, migrateFromLocalStorage]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        group_id: taskData.groupId,
        priority: taskData.priority,
        due_date: taskData.dueDate,
        estimated_effort: taskData.estimatedEffort,
        status: taskData.status,
        parent_id: taskData.parentId,
        dependencies: taskData.dependencies,
        reminder_days: taskData.reminderDays || 0,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    const newTask: Task = {
      ...taskData,
      id: data.id,
      createdAt: data.created_at,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    const supabaseUpdates: any = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.groupId !== undefined) supabaseUpdates.group_id = updates.groupId;
    if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) supabaseUpdates.due_date = updates.dueDate;
    if (updates.estimatedEffort !== undefined) supabaseUpdates.estimated_effort = updates.estimatedEffort;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    if (updates.parentId !== undefined) supabaseUpdates.parent_id = updates.parentId;
    if (updates.dependencies !== undefined) supabaseUpdates.dependencies = updates.dependencies;
    if (updates.reminderDays !== undefined) supabaseUpdates.reminder_days = updates.reminderDays;

    const { error } = await supabase
      .from('tasks')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) throw error;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    const toDelete = new Set([id]);
    let size = 0;
    while (toDelete.size !== size) {
      size = toDelete.size;
      tasks.forEach(t => {
        if (t.parentId && toDelete.has(t.parentId)) {
          toDelete.add(t.id);
        }
      });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', Array.from(toDelete));

    if (error) throw error;

    setTasks(prev => prev.filter(t => !toDelete.has(t.id)));
  };

  const addGroup = async (name: string) => {

    if (!user) return;

    const { data, error } = await supabase
      .from('groups')
      .insert({ name, user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    const newGroup: Group = {
      id: data.id,
      name,
    };
    setGroups(prev => [...prev, newGroup]);
    setSelectedGroups(prev => [...prev, newGroup.id]);
  };

  const deleteGroup = async (id: string) => {
    if (!user) return;

    const toDelete = new Set(tasks.filter(t => t.groupId === id).map(t => t.id));
    let size = 0;
    while (toDelete.size !== size) {
      size = toDelete.size;
      tasks.forEach(t => {
        if (t.parentId && toDelete.has(t.parentId)) {
          toDelete.add(t.id);
        }
      });
    }

    // Delete tasks first to avoid foreign key issues (though cascade would be better)
    if (toDelete.size > 0) {
      await supabase.from('tasks').delete().in('id', Array.from(toDelete));
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setGroups(prev => prev.filter(g => g.id !== id));
    setSelectedGroups(prev => prev.filter(gId => gId !== id));
    setTasks(prev => prev.filter(t => !toDelete.has(t.id)));
  };

  const toggleGroupSelection = (id: string) => {

    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  return (
    <TaskContext.Provider value={{ tasks, groups, selectedGroups, loading, addTask, updateTask, deleteTask, addGroup, deleteGroup, toggleGroupSelection }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

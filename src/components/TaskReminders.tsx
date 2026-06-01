import React from 'react';
import { useTasks } from '../context/TaskContext';
import type { Task } from '../types';

import { formatDateLocal, getStartOfDay, parseDateLocal } from '../utils/dateUtils';


const SubtaskItem = ({ subtask, updateTask, onOpenModal }: { subtask: Task, updateTask: (id: string, updates: Partial<Task>) => void, onOpenModal: (t: Task) => void }) => {
  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    updateTask(subtask.id, { status: e.target.checked ? 'Done' : 'Todo' });
  };

  return (
    <div 
      onClick={(e) => { 
        e.stopPropagation(); 
        onOpenModal(subtask); 
      }} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 12px', 
        cursor: 'pointer', 
        gap: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '8px',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      <input 
        type="checkbox" 
        checked={subtask.status === 'Done'} 
        onChange={handleCheck} 
        onClick={e => e.stopPropagation()}
        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ 
          fontSize: '13px',
          textDecoration: subtask.status === 'Done' ? 'line-through' : 'none', 
          color: subtask.status === 'Done' ? 'var(--text-secondary)' : 'white',
          fontWeight: 500
        }}>
          {subtask.title}
        </span>
        {subtask.dueDate && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {formatDateLocal(subtask.dueDate)}
          </span>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.5 }}>
        ↗
      </div>
    </div>
  );
};

const TaskCard = ({ task, tasks, updateTask, onOpenModal }: { task: Task, tasks: Task[], updateTask: (id: string, updates: Partial<Task>) => void, onOpenModal: (t: Task) => void }) => {
  const subtasks = tasks.filter(t => t.parentId === task.id);
  const completedSubtasks = subtasks.filter(t => t.status === 'Done').length;
  
  const dependenciesMet = task.dependencies.every(depId => {
    const dep = tasks.find(t => t.id === depId);
    return !dep || dep.status === 'Done';
  });

  const priorityColors: Record<string, string> = {
    High: 'var(--accent-danger)',
    Medium: 'var(--accent-warning)',
    Low: 'var(--accent-success)',
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    updateTask(task.id, { status: e.target.checked ? 'Done' : 'Todo' });
  };

  const parentTask = task.parentId ? tasks.find(t => t.id === task.parentId) : null;

  return (
    <div 
      onClick={() => onOpenModal(task)}
      className="glass-panel"
      style={{ 
        padding: '16px', 
        marginBottom: '12px', 
        cursor: 'pointer', 
        position: 'relative', 
        overflow: 'hidden', 
        opacity: !dependenciesMet ? 0.7 : 1, 
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        marginLeft: task.parentId ? '32px' : '0',
        borderLeft: task.parentId ? '3px solid var(--accent-primary)' : undefined
      }}
    >
      {!dependenciesMet && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-warning)' }} title="Dependencies not met" />
      )}
      {parentTask && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>↳ Subtask of:</span>
          <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{parentTask.title}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: priorityColors[task.priority], background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
          {task.priority}
        </span>
        {task.dueDate && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateLocal(task.dueDate)}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        <input 
          type="checkbox" 
          checked={task.status === 'Done'} 
          onChange={handleCheck} 
          onClick={e => e.stopPropagation()}
          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)', marginTop: '2px' }}
        />
        <h4 style={{ margin: 0, color: task.status === 'Done' ? 'var(--text-secondary)' : 'white', textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>{task.title}</h4>
      </div>
      
      {task.estimatedEffort && (
        <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⏱ {task.estimatedEffort}
        </div>
      )}

      {subtasks.length > 0 && (
        <div style={{ marginTop: '12px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Subtasks</span>
            <span>{completedSubtasks}/{subtasks.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subtasks.map(st => (
              <SubtaskItem key={st.id} subtask={st} updateTask={updateTask} onOpenModal={onOpenModal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TaskReminders = () => {
  const { tasks, updateTask, selectedGroups } = useTasks();



  const today = getStartOfDay(new Date());

  const reminderTasks = tasks.filter(t => {
    if (t.status === 'Done') return false;
    if (!t.dueDate || t.reminderDays === undefined || t.reminderDays === null) return false;
    
    // Only include if in selected groups
    if (t.groupId && !selectedGroups.includes(t.groupId)) return false;

    // A task can be a reminder if its due date minus reminder days is today or earlier
    const dueDate = parseDateLocal(t.dueDate);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - t.reminderDays);

    return getStartOfDay(reminderDate) <= today;
  });

  const sortedTasks = reminderTasks.sort((a, b) => {
    // Due date
    const dateA = parseDateLocal(a.dueDate!).getTime();
    const dateB = parseDateLocal(b.dueDate!).getTime();
    if (dateA !== dateB) return dateA - dateB;

    // Priority
    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const priorityA = priorityWeight[a.priority] || 0;
    const priorityB = priorityWeight[b.priority] || 0;
    return priorityB - priorityA;
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        {sortedTasks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No active reminders for today.
          </div>
        ) : (
          sortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              tasks={tasks} 
              updateTask={updateTask} 
              onOpenModal={(t) => document.dispatchEvent(new CustomEvent('edit-task-modal', { detail: t }))} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskReminders;

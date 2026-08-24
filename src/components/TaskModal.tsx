import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import type { Task, TaskPriority, TaskStatus } from '../types';

interface Props {
  task: Task | null;
  onClose: () => void;
  parentId?: string;
}

import { formatDateLocal } from '../utils/dateUtils';


const SubtaskItem = ({ subtask, updateTask, onClose }: { subtask: Task, updateTask: (id: string, data: Partial<Task>) => void, onClose: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    updateTask(subtask.id, { status: e.target.checked ? 'Done' : 'Todo' });
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <div 
        onClick={() => setExpanded(!expanded)} 
        style={{ display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer', gap: '12px' }}
      >
        <input 
          type="checkbox" 
          checked={subtask.status === 'Done'} 
          onChange={handleCheck} 
          onClick={e => e.stopPropagation()}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            textDecoration: subtask.status === 'Done' ? 'line-through' : 'none', 
            color: subtask.status === 'Done' ? 'var(--text-secondary)' : 'white',
            fontWeight: 500
          }}>
            {subtask.title}
          </span>
          {subtask.dueDate && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Due: {formatDateLocal(subtask.dueDate)}
            </span>
          )}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      
      {expanded && (
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {subtask.description ? (
            <p style={{ marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{subtask.description}</p>
          ) : (
            <p style={{ marginBottom: '12px', fontStyle: 'italic', opacity: 0.7 }}>No description provided.</p>
          )}
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
            <span><strong>Priority:</strong> {subtask.priority}</span>
            <span><strong>Status:</strong> {subtask.status}</span>
            {subtask.estimatedEffort && <span><strong>Effort:</strong> {subtask.estimatedEffort}</span>}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
             <button 
               type="button"
               className="btn-secondary" 
               style={{ padding: '6px 12px', fontSize: '12px' }}
               onClick={(e) => {
                 e.stopPropagation();
                 onClose();
                 setTimeout(() => document.dispatchEvent(new CustomEvent('edit-task-modal', { detail: subtask })), 100);
               }}
             >
               Edit Full Task
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskModal = ({ task, onClose, parentId }: Props) => {
  const { tasks, groups, addTask, updateTask, deleteTask } = useTasks();

  const parentTask = parentId ? tasks.find(t => t.id === parentId) : null;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'Todo');
  const [groupId, setGroupId] = useState(task?.groupId || parentTask?.groupId || (groups.length > 0 ? groups[0].id : ''));
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');
  const [estimatedEffort, setEstimatedEffort] = useState(task?.estimatedEffort || '');
  const [dependencies, setDependencies] = useState<string[]>(task?.dependencies || []);
  const [reminderDays, setReminderDays] = useState<number>(task?.reminderDays || 0);
  const getRecurrenceParts = () => {
    if (!task?.recurrence) {
      return { 
        base: null as 'daily' | 'weekly' | 'monthly' | null, 
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }), 
        dayOfMonth: new Date().getDate() 
      };
    }
    if (task.recurrence.startsWith('weekly:')) {
      return { 
        base: 'weekly' as const, 
        dayOfWeek: task.recurrence.split(':')[1], 
        dayOfMonth: new Date().getDate() 
      };
    }
    if (task.recurrence.startsWith('monthly:')) {
      return { 
        base: 'monthly' as const, 
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }), 
        dayOfMonth: parseInt(task.recurrence.split(':')[1], 10) 
      };
    }
    return { 
      base: task.recurrence as 'daily' | 'weekly' | 'monthly', 
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }), 
      dayOfMonth: new Date().getDate() 
    };
  };

  const initialParts = getRecurrenceParts();
  const [recurrenceBase, setRecurrenceBase] = useState<'daily' | 'weekly' | 'monthly' | null>(initialParts.base);
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState<string>(initialParts.dayOfWeek);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number>(initialParts.dayOfMonth);
  const [error, setError] = useState('');

  const isEditing = !!task;

  const handleRecurrenceBaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'daily' | 'weekly' | 'monthly' | '';
    if (recurrenceBase && value === '') {
      const confirmEnd = window.confirm("Are you sure you want to end the recurring tasks?");
      if (!confirmEnd) {
        return; // Cancel change
      }
    }
    setRecurrenceBase(value || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !priority || !status || !estimatedEffort || (!parentId && !groupId)) {
      setError('Please fill in all required fields (Title, Priority, Status, Effort' + (!parentId ? ', and Group' : '') + ').');
      return;
    }

    if (recurrenceBase && !dueDate) {
      setError('Please set an End Date for the recurring task.');
      return;
    }
    
    setError('');

    let recurrenceValue: string | null = null;
    if (recurrenceBase === 'daily') {
      recurrenceValue = 'daily';
    } else if (recurrenceBase === 'weekly') {
      recurrenceValue = `weekly:${recurrenceDayOfWeek}`;
    } else if (recurrenceBase === 'monthly') {
      recurrenceValue = `monthly:${recurrenceDayOfMonth}`;
    }

    const taskData = {
      title,
      description,
      priority,
      status,
      groupId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estimatedEffort,
      dependencies,
      reminderDays: dueDate ? reminderDays : 0,
      parentId: task?.parentId || parentId,
      recurrence: recurrenceValue,
      recurrenceEndDate: recurrenceValue && dueDate ? new Date(dueDate).toISOString() : null,
      recurrenceOccurrenceDate: task?.recurrenceOccurrenceDate || new Date().toISOString()
    };

    if (isEditing && task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const possibleDependencies = tasks.filter(t => t.id !== task?.id && !t.parentId && t.status !== 'Done' && t.dueDate);
  const subtasks = task ? tasks.filter(t => t.parentId === task.id) : [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-panel" style={{ width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
        <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <h2 style={{ marginBottom: '24px' }}>{isEditing ? 'Edit Task' : (parentId ? 'New Subtask' : 'New Task')}</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Title *</label>
            <input
              autoFocus
              required
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}
              placeholder="Task Title"
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Priority *</label>
              <select required value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Status *</label>
              <select required value={status} onChange={e => {
                const newStatus = e.target.value as TaskStatus;
                setStatus(newStatus);
                if (newStatus === 'Done') {
                  setDependencies([]);
                }
              }} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Recurrence</label>
              <select value={recurrenceBase || ''} onChange={handleRecurrenceBaseChange} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {recurrenceBase === 'weekly' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Repeat On</label>
                <select value={recurrenceDayOfWeek} onChange={e => setRecurrenceDayOfWeek(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            {recurrenceBase === 'monthly' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Repeat Day of Month</label>
                <select value={recurrenceDayOfMonth} onChange={e => setRecurrenceDayOfMonth(parseInt(e.target.value, 10))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{recurrenceBase ? 'End Date *' : 'Due Date (Optional)'}</label>
                {dueDate && (
                  <button 
                    type="button" 
                    onClick={() => setDueDate('')} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <input type="date" min={new Date().toLocaleDateString('en-CA')} value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Effort * (e.g. 2h)</label>
              <input required type="text" value={estimatedEffort} onChange={e => setEstimatedEffort(e.target.value)} placeholder="e.g. 2h, 1d" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }} />
            </div>
          </div>

          {!parentId && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Group *</label>
              <select required value={groupId} onChange={e => setGroupId(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}>
                <option value="" disabled>Select a group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: status === 'Done' ? 'rgba(148, 163, 184, 0.4)' : 'var(--text-secondary)' }}>Dependencies</label>
            {status === 'Done' ? (
              <div style={{ padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px', background: 'rgba(255,255,255,0.02)' }}>
                Completed tasks cannot have dependencies.
              </div>
            ) : (
              <>
                <select multiple value={dependencies} onChange={e => setDependencies(Array.from(e.target.selectedOptions, option => option.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', minHeight: '80px' }}>
                  {possibleDependencies.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hold Ctrl/Cmd to select multiple</span>
              </>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: !dueDate ? 'rgba(148, 163, 184, 0.4)' : 'var(--text-secondary)' }}>Reminder (Days before due date)</label>
            <input 
              type="number" 
              min="0" 
              disabled={!dueDate}
              value={dueDate ? reminderDays : 0} 
              onChange={e => setReminderDays(parseInt(e.target.value) || 0)} 
              style={{ 
                width: '100%', 
                background: !dueDate ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border-color)', 
                color: !dueDate ? 'rgba(255,255,255,0.2)' : 'white', 
                padding: '12px', 
                borderRadius: '8px', 
                outline: 'none',
                cursor: !dueDate ? 'not-allowed' : 'text'
              }} 
            />
            <span style={{ fontSize: '12px', color: !dueDate ? 'rgba(148, 163, 184, 0.3)' : 'var(--text-secondary)' }}>
              {!dueDate ? 'Set a due date to enable reminders' : 'Enter 0 for same-day reminder'}
            </span>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', minHeight: '100px', resize: 'vertical' }}
              placeholder="Task details..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            {isEditing ? (
              <button type="button" onClick={() => { deleteTask(task.id); onClose(); }} style={{ color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
                Delete Task
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Task</button>
            </div>
          </div>
        </form>

        {isEditing && !task.parentId && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Subtasks</h3>
              <button className="btn-secondary" onClick={() => {
                onClose();
                setTimeout(() => document.dispatchEvent(new CustomEvent('open-subtask-modal', { detail: task.id })), 100);
              }}>+ Add Subtask</button>
            </div>
            {subtasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No subtasks yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subtasks.map(st => (
                  <SubtaskItem key={st.id} subtask={st} updateTask={updateTask} onClose={onClose} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TaskModal;

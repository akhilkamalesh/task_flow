import React from 'react';
import { useTasks } from '../context/TaskContext';
import type { Task, TaskStatus } from '../types';
import { formatDateLocal, parseDateLocal } from '../utils/dateUtils';

const statusColumns: TaskStatus[] = ['Todo', 'In Progress', 'Done'];

const TaskBoard = () => {
  const { tasks, updateTask, selectedGroups } = useTasks();

  const topLevelTasks = tasks.filter(t => !t.parentId && (t.groupId ? selectedGroups.includes(t.groupId) : true));

  const statusColors: Record<string, string> = {
    Todo: 'var(--text-secondary)',
    'In Progress': 'var(--accent-primary)',
    Done: 'var(--accent-success)',
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTask(taskId, { status });
    }
  };

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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenModal(task)}
      className="glass-panel"
      style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden', opacity: !dependenciesMet ? 0.7 : 1, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
    >
      {!dependenciesMet && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-warning)' }} title="Dependencies not met" />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: priorityColors[task.priority], background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
          {task.priority}
        </span>
        {task.dueDate && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateLocal(task.dueDate)}</span>}
      </div>
      <h4 style={{ marginBottom: '8px', color: task.status === 'Done' ? 'var(--text-secondary)' : 'white', textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>{task.title}</h4>
      
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

  return (
    <>
      <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
        {statusColumns.map(status => {
          const columnTasks = topLevelTasks.filter(t => {
            if (t.status !== status) return false;
            if (status === 'Done') {
              if (!t.dueDate) return true;
              const completedDate = parseDateLocal(t.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              completedDate.setHours(0, 0, 0, 0);
              const diffTime = today.getTime() - completedDate.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              return diffDays <= 7;
            }
            return true;
          });

          return (
            <div 
              key={status} 
              className="glass-panel"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(26, 29, 36, 0.4)', borderRadius: '16px', overflow: 'hidden' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, status)}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: statusColors[status] || 'var(--text-secondary)'
                  }} />
                  {status}
                </div>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', minWidth: '24px', textAlign: 'center' }}>
                  {columnTasks.length}
                </span>
              </div>
              <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                {columnTasks
                  .sort((a, b) => {
                    if (status === 'Done') {
                      if (a.dueDate && b.dueDate) {
                        return parseDateLocal(b.dueDate).getTime() - parseDateLocal(a.dueDate).getTime();
                      } else if (a.dueDate) {
                        return -1;
                      } else if (b.dueDate) {
                        return 1;
                      }
                      return 0;
                    }
                    if (a.dueDate && b.dueDate) {
                      const dateA = parseDateLocal(a.dueDate).getTime();
                      const dateB = parseDateLocal(b.dueDate).getTime();
                      if (dateA !== dateB) return dateA - dateB;
                    } else if (a.dueDate) {
                      return -1;
                    } else if (b.dueDate) {
                      return 1;
                    }

                    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
                    const priorityA = priorityWeight[a.priority] || 0;
                    const priorityB = priorityWeight[b.priority] || 0;
                    return priorityB - priorityA;
                  })
                  .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    tasks={tasks} 
                    updateTask={updateTask} 
                    onOpenModal={(t) => document.dispatchEvent(new CustomEvent('edit-task-modal', { detail: t }))} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TaskBoard;

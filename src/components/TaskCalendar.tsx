import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import type { Task } from '../types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TaskCalendar = () => {
  const { tasks, updateTask, selectedGroups } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const visibleTasks = tasks.filter(t => !t.parentId && (t.groupId ? selectedGroups.includes(t.groupId) : true));

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      // Create string YYYY-MM-DD
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateString = `${year}-${mStr}-${dStr}`;
      updateTask(taskId, { dueDate: dateString });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openTaskModal = (task: Task) => {
    document.dispatchEvent(new CustomEvent('edit-task-modal', { detail: task }));
  };

  const priorityColors: Record<string, string> = {
    High: 'var(--accent-danger)',
    Medium: 'var(--accent-warning)',
    Low: 'var(--accent-success)',
  };

  const statusColors: Record<string, string> = {
    Todo: 'var(--text-secondary)',
    'In Progress': 'var(--accent-primary)',
    Done: 'var(--accent-success)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={today} className="btn-secondary" style={{ padding: '6px 12px' }}>Today</button>
          <button onClick={prevMonth} className="btn-icon" style={{ padding: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMonth} className="btn-icon" style={{ padding: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', minWidth: '910px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            {DAYS_OF_WEEK.map(day => (
              <div key={day} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {day}
              </div>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gridAutoRows: 'minmax(100px, 1fr)', flex: 1, overflowY: 'auto', minWidth: '910px' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }} />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              
              const tasksForDay = visibleTasks.filter(t => {
                if (!t.dueDate) return false;
                const dateStr = t.dueDate.split('T')[0];
                const [ty, tm, td] = dateStr.split('-').map(Number);
                return ty === year && tm - 1 === month && td === day;
              });

              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <div 
                  key={day} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  style={{ 
                    borderRight: '1px solid var(--border-color)', 
                    borderBottom: '1px solid var(--border-color)', 
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    background: isToday ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ 
                    textAlign: 'right', 
                    fontSize: '13px', 
                    fontWeight: isToday ? 'bold' : 500,
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    marginBottom: '2px',
                    background: isToday ? 'rgba(255,255,255,0.1)' : 'transparent',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    alignSelf: 'flex-end'
                  }}>
                    {day}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {tasksForDay.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => openTaskModal(task)}
                        style={{
                          padding: '6px 8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'grab',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          borderLeft: `3px solid ${priorityColors[task.priority]}`,
                          opacity: task.status === 'Done' ? 0.5 : 1,
                          textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                          color: 'var(--text-primary)',
                          transition: 'background 0.2s, transform 0.1s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        title={task.title}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: statusColors[task.status] || 'var(--text-secondary)',
                          flexShrink: 0
                        }} />
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar;

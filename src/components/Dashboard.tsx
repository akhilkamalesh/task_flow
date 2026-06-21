import { useTasks } from '../context/TaskContext';
import Sidebar from './Sidebar';
import TaskBoard from './TaskBoard';
import TaskCalendar from './TaskCalendar';
import TaskReminders from './TaskReminders';
import TaskModal from './TaskModal';
import { TaskCard } from './TaskBoard';
import type { ViewState, Task } from '../types';
import { useState, useEffect } from 'react';

export const Dashboard = ({ currentView, onViewChange }: { currentView: ViewState, onViewChange: (view: ViewState) => void }) => {
  const { loading, tasks, updateTask, selectedGroups } = useTasks();
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalParentId, setModalParentId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);

  const backlogTasks = tasks
    .filter(t => !t.parentId && !t.dueDate && (t.groupId ? selectedGroups.includes(t.groupId) : true))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    const handleOpen = () => {
      setModalTask(null);
      setModalParentId(undefined);
      setIsModalOpen(true);
    };
    const handleOpenSub = (e: Event) => {
      const customEvent = e as CustomEvent;
      setModalTask(null);
      setModalParentId(customEvent.detail);
      setIsModalOpen(true);
    };
    const handleEdit = (e: Event) => {
      const customEvent = e as CustomEvent;
      setModalTask(customEvent.detail);
      setModalParentId(undefined);
      setIsModalOpen(true);
    };

    document.addEventListener('open-task-modal', handleOpen);
    document.addEventListener('open-subtask-modal', handleOpenSub);
    document.addEventListener('edit-task-modal', handleEdit);

    return () => {
      document.removeEventListener('open-task-modal', handleOpen);
      document.removeEventListener('open-subtask-modal', handleOpenSub);
      document.removeEventListener('edit-task-modal', handleEdit);
    };
  }, []);

  return (
    <>
      <div className="app-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loader"></div>
          </div>
        )}
        <Sidebar currentView={currentView} onViewChange={onViewChange} />
        <main className="main-content">
          <header className="main-header glass-panel">
            <h2>{currentView === 'board' ? 'All Tasks' : currentView === 'calendar' ? 'Calendar' : 'Reminders'}</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentView === 'board' && (
                <button 
                  className="btn-secondary" 
                  onClick={() => setIsBacklogOpen(prev => !prev)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                  Backlog {backlogTasks.length > 0 && `(${backlogTasks.length})`}
                </button>
              )}
              <button className="btn-primary" onClick={() => document.dispatchEvent(new CustomEvent('open-task-modal'))}>
                + New Task
              </button>
            </div>
          </header>
          {currentView === 'board' ? <TaskBoard /> : currentView === 'calendar' ? <TaskCalendar /> : <TaskReminders />}
        </main>
      </div>

      {isModalOpen && (
        <TaskModal
          task={modalTask}
          parentId={modalParentId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {/* Slide-out Right Drawer for Backlog */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: isBacklogOpen ? 0 : '-420px',
          width: '400px',
          height: '100vh',
          background: 'rgba(26, 29, 36, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-4px 0 30px rgba(0, 0, 0, 0.5)',
          transition: 'right 0.3s ease-in-out',
          zIndex: 95,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-warning)' }} />
            Backlog Tasks ({backlogTasks.length})
          </h3>
          <button onClick={() => setIsBacklogOpen(false)} className="btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {backlogTasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
              No backlog tasks.
            </div>
          ) : (
            backlogTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                tasks={tasks} 
                updateTask={updateTask} 
                onOpenModal={(t) => {
                  setIsBacklogOpen(false);
                  document.dispatchEvent(new CustomEvent('edit-task-modal', { detail: t }));
                }} 
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

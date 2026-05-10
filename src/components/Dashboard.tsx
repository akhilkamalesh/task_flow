import { useTasks } from '../context/TaskContext';
import Sidebar from './Sidebar';
import TaskBoard from './TaskBoard';
import TaskCalendar from './TaskCalendar';
import TaskModal from './TaskModal';
import type { ViewState } from '../App';
import { useState, useEffect } from 'react';
import type { Task } from '../types';

export const Dashboard = ({ currentView, onViewChange }: { currentView: ViewState, onViewChange: (view: ViewState) => void }) => {
  const { loading } = useTasks();
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalParentId, setModalParentId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <Sidebar currentView={currentView} onViewChange={onViewChange} />
        <main className="main-content">
          <header className="main-header glass-panel">
            <h2>{currentView === 'board' ? 'All Tasks' : 'Calendar'}</h2>
            <button className="btn-primary" onClick={() => document.dispatchEvent(new CustomEvent('open-task-modal'))}>
              + New Task
            </button>
          </header>
          {currentView === 'board' ? <TaskBoard /> : <TaskCalendar />}
        </main>
      </div>
      
      {isModalOpen && (
        <TaskModal 
          task={modalTask} 
          parentId={modalParentId}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};

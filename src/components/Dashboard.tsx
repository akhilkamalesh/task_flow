import { useTasks } from '../context/TaskContext';
import Sidebar from './Sidebar';
import TaskBoard from './TaskBoard';
import TaskCalendar from './TaskCalendar';
import TaskReminders from './TaskReminders';
import TaskModal from './TaskModal';
import type { ViewState, Task } from '../types';
import { useState, useEffect } from 'react';

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
            <button className="btn-primary" onClick={() => document.dispatchEvent(new CustomEvent('open-task-modal'))}>
              + New Task
            </button>
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
    </>
  );
};

import { useState, useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import './styles/index.css';
import Sidebar from './components/Sidebar';
import TaskBoard from './components/TaskBoard';
import TaskCalendar from './components/TaskCalendar';
import TaskModal from './components/TaskModal';
import type { Task } from './types';

export type ViewState = 'board' | 'calendar';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('board');
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
    <TaskProvider>
      <div className="app-container">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
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
    </TaskProvider>
  );
}

export default App;

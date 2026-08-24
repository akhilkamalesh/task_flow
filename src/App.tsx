import { useState, useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/Dashboard';
import './styles/index.css';
import type { ViewState } from './types';


function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('board');

  useEffect(() => {
    const handleChangeView = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentView(customEvent.detail);
    };
    window.addEventListener('change-view', handleChangeView);
    return () => window.removeEventListener('change-view', handleChangeView);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <TaskProvider>
      <Dashboard currentView={currentView} onViewChange={setCurrentView} />
    </TaskProvider>
  );
}

export default App;

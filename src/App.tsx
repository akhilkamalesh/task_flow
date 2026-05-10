import { useState } from 'react';
import { TaskProvider } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/Dashboard';
import './styles/index.css';

export type ViewState = 'board' | 'calendar';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('board');

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

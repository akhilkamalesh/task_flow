import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTasks } from '../context/TaskContext';
import { searchTasks } from '../utils/vectorSearch';
import type { SearchResult } from '../utils/vectorSearch';
import type { Task } from '../types';

export const SearchBar = () => {
  const { tasks, groups } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
  }, [isOpen]);

  // Perform search when query or tasks change
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      // Default: show the 10 most recently created tasks
      const sorted = [...tasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(t => ({ task: t, score: 0 }));
      setResults(sorted);
      return;
    }

    const searchResults = searchTasks(tasks, query);
    // Sort by score descending and filter out extremely low matches
    const filteredResults = searchResults
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score);
    setResults(filteredResults);
  }, [query, tasks, isOpen]);

  const handleTaskClick = (task: Task) => {
    setIsOpen(false);
    // Dispatch custom event to edit the task (as used elsewhere in the application)
    document.dispatchEvent(new CustomEvent('edit-task-modal', { detail: task }));
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Inbox';
    return groups.find(g => g.id === groupId)?.name || 'Inbox';
  };

  const getParentTaskTitle = (parentId?: string) => {
    if (!parentId) return null;
    return tasks.find(t => t.id === parentId)?.title || null;
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
    <>
      <button className="search-trigger" onClick={() => setIsOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <span className="search-trigger-text">Search tasks...</span>
        <span className="search-trigger-kbd">⌘K</span>
      </button>

      {isOpen && createPortal(
        <div className="search-modal-overlay" onClick={() => setIsOpen(false)}>
          <div 
            ref={modalRef}
            className="search-modal-content glass-panel" 
            onClick={e => e.stopPropagation()}
          >
            <div className="search-modal-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)', marginRight: '12px' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search all tasks (including backlog & archived)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="search-modal-input"
              />
              <span className="search-modal-esc" onClick={() => setIsOpen(false)}>ESC</span>
            </div>

            <div className="search-modal-body">
              <div className="search-results-section">
                <div className="search-results-title">
                  {query ? 'Vector Search Results' : 'Recent Tasks'}
                </div>
                
                {results.length === 0 ? (
                  <div className="search-no-results">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', marginBottom: '12px', opacity: 0.5 }}>
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <div>No tasks found matching your query</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Try searching for task titles, descriptions, or keywords.</div>
                  </div>
                ) : (
                  <div className="search-results-list">
                    {results.map(({ task, score }) => {
                      const parentTitle = getParentTaskTitle(task.parentId);
                      return (
                        <div 
                          key={task.id} 
                          className="search-result-item" 
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="search-result-item-main">
                            {parentTitle && (
                              <div className="search-result-parent">
                                {parentTitle} <span style={{ margin: '0 4px', fontSize: '10px' }}>›</span>
                              </div>
                            )}
                            <div className="search-result-title">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="search-result-description">
                                {task.description}
                              </div>
                            )}
                          </div>
                          
                          <div className="search-result-item-meta">
                            {/* Similarity Score Indicator */}
                            {query && score > 0 && (
                              <div className="search-result-score-badge" style={{
                                background: `rgba(99, 102, 241, ${Math.min(0.3, score * 0.3)})`,
                                border: `1px solid rgba(99, 102, 241, ${Math.min(0.6, score * 0.6)})`
                              }}>
                                {Math.round(score * 100)}% match
                              </div>
                            )}

                            {/* Group Tag */}
                            <span className="search-result-group">
                              {getGroupName(task.groupId)}
                            </span>

                            {/* Priority Badge */}
                            <span 
                              className="search-result-priority" 
                              style={{ 
                                color: priorityColors[task.priority],
                                background: `rgba(${task.priority === 'High' ? '239, 68, 68' : task.priority === 'Medium' ? '245, 158, 11' : '16, 185, 129'}, 0.1)` 
                              }}
                            >
                              {task.priority}
                            </span>

                            {/* Status Badge */}
                            <span className="search-result-status" style={{ border: `1px solid ${statusColors[task.status]}` }}>
                              {!task.dueDate ? 'Backlog' : task.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="search-modal-footer">
              <div style={{ display: 'flex', gap: '16px' }}>
                <span><kbd>↑↓</kbd> Navigate</span>
                <span><kbd>↵</kbd> Select</span>
                <span><kbd>ESC</kbd> Close</span>
              </div>
              <div>Vector Search enabled</div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Styled scoped block for search styles */}
      <style>{`
        .search-trigger {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 260px;
          justify-content: flex-start;
          gap: 10px;
        }

        .search-trigger:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .search-trigger-text {
          font-size: 14px;
          color: var(--text-secondary);
          flex: 1;
          text-align: left;
        }

        .search-trigger-kbd {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          font-family: var(--font-family);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 17, 21, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
        }

        .search-modal-content {
          width: 100%;
          max-width: 650px;
          background: rgba(26, 29, 36, 0.95);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          max-height: 70vh;
          overflow: hidden;
          animation: scaleUp 0.15s ease-out;
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .search-modal-header {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .search-modal-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
          font-family: var(--font-family);
        }

        .search-modal-esc {
          font-size: 11px;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .search-results-section {
          display: flex;
          flex-direction: column;
        }

        .search-results-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          padding-left: 8px;
        }

        .search-results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-result-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .search-result-item-main {
          flex: 1;
          padding-right: 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .search-result-parent {
          font-size: 11px;
          color: var(--text-secondary);
          opacity: 0.8;
        }

        .search-result-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .search-result-description {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }

        .search-result-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-result-score-badge {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-primary);
          padding: 2px 6px;
          border-radius: 6px;
        }

        .search-result-group {
          font-size: 11px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .search-result-priority {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .search-result-status {
          font-size: 11px;
          color: var(--text-primary);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .search-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
          color: var(--text-primary);
          text-align: center;
          font-size: 14px;
        }

        .search-modal-footer {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          background: rgba(15, 17, 21, 0.4);
          border-top: 1px solid var(--border-color);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .search-modal-footer kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          padding: 1px 4px;
          font-family: inherit;
        }
      `}</style>
    </>
  );
};

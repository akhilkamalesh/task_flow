import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import type { Group } from '../types';
import type { ViewState } from '../types';
import { getStartOfDay, parseDateLocal } from '../utils/dateUtils';


interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { tasks, groups, addGroup, deleteGroup, selectedGroups, toggleGroupSelection } = useTasks();
  const { user, signOut } = useAuth();
  const [newGroupName, setNewGroupName] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);


  const today = getStartOfDay(new Date());

  const reminderCount = tasks.filter(t => {
    if (t.status === 'Done') return false;
    if (!t.dueDate || t.reminderDays === undefined || t.reminderDays === null) return false;
    if (t.groupId && !selectedGroups.includes(t.groupId)) return false;
    const dueDate = parseDateLocal(t.dueDate);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - t.reminderDays);
    return getStartOfDay(reminderDate) <= today;
  }).length;



  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  return (
    <aside className="sidebar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--accent-primary)', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            TaskFlow
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => onViewChange('board')}
              className="btn-icon"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', padding: '10px 16px', borderRadius: '8px',
                background: currentView === 'board' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: currentView === 'board' ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: currentView === 'board' ? 600 : 500,
                transition: 'all 0.2s', width: '100%'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
              Board
            </button>
            <button 
              onClick={() => onViewChange('calendar')}
              className="btn-icon"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', padding: '10px 16px', borderRadius: '8px',
                background: currentView === 'calendar' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: currentView === 'calendar' ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: currentView === 'calendar' ? 600 : 500,
                transition: 'all 0.2s', width: '100%'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
              Calendar
            </button>
            <button 
              onClick={() => onViewChange('reminders')}
              className="btn-icon"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: '8px',
                background: currentView === 'reminders' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: currentView === 'reminders' ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: currentView === 'reminders' ? 600 : 500,
                transition: 'all 0.2s', width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Reminders
              </div>
              {reminderCount > 0 && (
                <div style={{ 
                  background: 'var(--accent-primary)', 
                  color: 'white', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px'
                }}>
                  {reminderCount}
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="groups-section">
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '12px' }}>Groups</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map(g => (
              <li 
                key={g.id} 
                onClick={() => toggleGroupSelection(g.id)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  background: selectedGroups.includes(g.id) ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', 
                  opacity: selectedGroups.includes(g.id) ? 1 : 0.5,
                  transition: 'all 0.2s' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedGroups.includes(g.id)} 
                    onChange={() => toggleGroupSelection(g.id)} 
                    onClick={e => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{g.name}</span>
                </div>
                {g.name !== 'Inbox' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setGroupToDelete(g);
                    }} 
                    className="btn-icon"
                    style={{ padding: '4px' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
          
          <form onSubmit={handleAddGroup} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={newGroupName} 
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="+ New Group"
              style={{ flex: 1, background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </form>
        </div>
      </div>

      <div className="user-profile" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '14px' 
          }}>
            {user?.email?.[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button 
          onClick={() => signOut()}
          className="btn-secondary"
          style={{ 
            width: '100%', padding: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Sign Out
        </button>
      </div>

      {groupToDelete && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90vw', padding: '24px', position: 'relative' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent-danger)' }}>Delete Group</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete the group <strong>"{groupToDelete.name}"</strong>?<br/><br/>
              This will permanently delete all tasks and subtasks associated with it. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setGroupToDelete(null)} className="btn-secondary">Cancel</button>
              <button 
                onClick={() => {
                  deleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }} 
                style={{ color: 'white', background: 'var(--accent-danger)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
};

export default Sidebar;

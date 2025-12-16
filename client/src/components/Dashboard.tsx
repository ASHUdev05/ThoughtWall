import React, { useState, useEffect } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config';

// Components
import ThoughtList from './ThoughtList';
import KanbanBoard from './KanbanBoard';
import ThoughtForm from './ThoughtForm';
import RoomManager from './RoomManager';
import ChatWidget from './ChatWidget';
import Toast from './Toast';

// Hooks & Services
import { useThoughts } from '../hooks/useThoughts';
import { userService } from '../services/userService';

// Styles
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<number | undefined>(undefined);
  const [availableTags, setAvailableTags] = useState<string[]>(['General', 'Idea', 'To-Do', 'Important']);
  const defaultTags = ['General', 'Idea', 'To-Do', 'Important'];

  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    thoughts,
    loading,
    error,
    refresh,
    addThought,
    removeThought,
    editThought,
    updateThought,
    togglePin,
    toggleComplete,
    assignUser,
    page,
    setPage,
    totalPages
  } = useThoughts("All", currentRoomId);

  useEffect(() => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        if (currentRoomId) subscribeToRoom(client, currentRoomId);
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    setStompClient(client);
    return () => { client.deactivate(); };
  }, []);

  useEffect(() => {
    if (stompClient && connected && currentRoomId) {
      subscribeToRoom(stompClient, currentRoomId);
    }
  }, [currentRoomId, stompClient, connected]);

  const subscribeToRoom = (client: Client, roomId: number) => {
    client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
      if (message.body === 'UPDATE') {
        refresh();
        showToast('Board updated', 'success');
      }
    });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleRoomChange = (roomId?: number) => {
    setCurrentRoomId(roomId);
    setPage(0); // Reset page on room change
  };

  const handleLogout = () => {
    userService.logout();
    window.location.reload();
  };

  const handleDeleteTag = (tag: string) => {
    setAvailableTags(prev => prev.filter(t => t !== tag));
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>ThoughtWall</h1>
          <RoomManager 
            activeRoomId={currentRoomId} 
            onRoomSelect={handleRoomChange} 
          />
        </div>
        <div className="header-right">
          <div className="view-toggles">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
            <button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => setViewMode('kanban')}>Kanban</button>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        {loading && <div className="loading-spinner">Loading...</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="action-bar">
          <button className="add-thought-btn" onClick={() => setIsFormOpen(true)}>+ New Thought</button>
          <div className="connection-status">
            Status: <span className={connected ? 'status-ok' : 'status-err'}>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        <div style={{display:'flex', justifyContent:'center', gap:'1rem', marginBottom:'1rem', alignItems:'center'}}>
            <button 
                className="tag-btn" 
                disabled={page === 0} 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                style={{opacity: page === 0 ? 0.5 : 1}}
            >
                ◀ Prev
            </button>
            <span style={{fontSize:'0.9rem', opacity:0.8}}>Page {page + 1} of {totalPages || 1}</span>
            <button 
                className="tag-btn" 
                disabled={page >= totalPages - 1} 
                onClick={() => setPage(p => p + 1)}
                style={{opacity: page >= totalPages - 1 ? 0.5 : 1}}
            >
                Next ▶
            </button>
        </div>

        {viewMode === 'list' ? (
          <ThoughtList
            thoughts={thoughts}
            loading={loading}
            onDelete={removeThought}
            onToggleComplete={toggleComplete}
            onPin={togglePin}
            onEdit={editThought}
            onAssign={assignUser}
          />
        ) : (
          <KanbanBoard
            thoughts={thoughts}
            availableTags={availableTags}
            onUpdateThought={updateThought}
          />
        )}
      </main>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth:'800px'}}>
            <ThoughtForm
              onAdd={async (content, tag, dueDate) => {
                const success = await addThought(content, tag, dueDate);
                if (success) {
                  setIsFormOpen(false);
                  showToast('Thought created!', 'success');
                  if (!availableTags.includes(tag)) setAvailableTags(prev => [...prev, tag]);
                }
                return success;
              }}
              availableTags={availableTags}
              defaultTags={defaultTags}
              onDeleteTag={handleDeleteTag}
            />
            <button className="tag-btn" style={{marginTop: '10px'}} onClick={() => setIsFormOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {currentRoomId && <ChatWidget roomId={currentRoomId.toString()} stompClient={stompClient} connected={connected} />}
    </div>
  );
};

export default Dashboard;
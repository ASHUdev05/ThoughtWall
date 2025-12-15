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
  // --- State ---
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Changed to number | undefined to match RoomManager and Service types
  const [currentRoomId, setCurrentRoomId] = useState<number | undefined>(undefined);
  
  // Tag management state (needed for ThoughtForm/Kanban)
  const [availableTags, setAvailableTags] = useState<string[]>(['General', 'Idea', 'To-Do', 'Important']);
  const defaultTags = ['General', 'Idea', 'To-Do', 'Important'];

  // WebSocket State
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- Hook Usage ---
  // We destructure the actual names exported by useThoughts
  const {
    thoughts,
    loading,
    error,
    refresh,        // was fetchThoughts
    addThought,     // was createThought
    removeThought,  // was deleteThought
    editThought,    // was updateThought (for content edits)
    updateThought,  // generic update (for Kanban moves)
    togglePin,
    toggleComplete, // was toggleCompletion
    assignUser
  } = useThoughts("All", currentRoomId);

  // --- WebSocket Connection Logic ---
  useEffect(() => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        if (currentRoomId) {
          subscribeToRoom(client, currentRoomId);
        }
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        showToast('Connection error', 'error');
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  // Handle Room Switching for WebSockets
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

  // --- Handlers ---

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleRoomChange = (roomId?: number) => {
    setCurrentRoomId(roomId);
  };

  const handleLogout = () => {
    userService.logout();
    window.location.reload();
  };

  // Tag Handlers for ThoughtForm
  const handleDeleteTag = (tag: string) => {
    setAvailableTags(prev => prev.filter(t => t !== tag));
  };

  // --- Render ---

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>ThoughtWall</h1>
          {/* Fixed Props: activeRoomId, onRoomSelect */}
          <RoomManager 
            activeRoomId={currentRoomId} 
            onRoomSelect={handleRoomChange} 
          />
        </div>
        <div className="header-right">
          <div className="view-toggles">
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={viewMode === 'kanban' ? 'active' : ''} 
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>
          
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {loading && <div className="loading-spinner">Loading thoughts...</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="action-bar">
          <button className="add-thought-btn" onClick={() => setIsFormOpen(true)}>
            + New Thought
          </button>
          <div className="connection-status">
            Status: <span className={connected ? 'status-ok' : 'status-err'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
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
            // roomMembers={[]} // You can pass real members here if you fetch them
          />
        ) : (
          <KanbanBoard
            thoughts={thoughts}
            availableTags={availableTags}
            onUpdateThought={updateThought}
            // roomMembers={[]} 
          />
        )}
      </main>

      {/* Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ThoughtForm
              // Fixed Props: onAdd, availableTags, etc.
              onAdd={async (content, tag, dueDate) => {
                const success = await addThought(content, tag, dueDate);
                if (success) {
                  setIsFormOpen(false);
                  showToast('Thought created!', 'success');
                  // Add tag to local list if it's new
                  if (!availableTags.includes(tag)) {
                    setAvailableTags(prev => [...prev, tag]);
                  }
                }
                return success;
              }}
              availableTags={availableTags}
              defaultTags={defaultTags}
              onDeleteTag={handleDeleteTag}
            />
            <button 
              className="tag-btn" 
              style={{marginTop: '10px'}} 
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} // Fixed: Added onClose
        />
      )}

      {/* Chat Widget */}
      {currentRoomId && (
        <ChatWidget 
          roomId={currentRoomId.toString()} // Convert number to string for ChatWidget
          stompClient={stompClient} 
          connected={connected} 
        />
      )}
    </div>
  );
};

export default Dashboard;